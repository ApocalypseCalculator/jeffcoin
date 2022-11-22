
#include <cuda_runtime.h>
#include <device_launch_parameters.h>
#include <iostream>
#include <chrono>
#include <cmath>
#include <thread>
#include <iomanip>
#include <string>
#include <cassert>
#include <cstring>

#include "sha256.cuh"

#define SHOW_INTERVAL_MS 2000
#define BLOCK_SIZE 256
#define SHA_PER_ITERATIONS 8'388'608
#define NUMBLOCKS (SHA_PER_ITERATIONS + BLOCK_SIZE - 1) / BLOCK_SIZE

static size_t difficulty = 1;

// Output string by the device read by host
char *g_out = nullptr;
unsigned char *g_hash_out = nullptr;
int *g_found = nullptr;

static uint64_t nonce = 0;
static uint64_t user_nonce = 0;
static uint64_t last_nonce_since_update = 0;

// Last timestamp we printed debug infos
static std::chrono::high_resolution_clock::time_point t_last_updated;

__device__ bool checkZeroPadding(unsigned char *sha, uint8_t difficulty)
{

    bool isOdd = difficulty % 2 != 0;
    uint8_t max = (difficulty / 2) + 1;

    /*
        Odd : 00 00 01 need to check 0 -> 2
        Even : 00 00 00 1 need to check 0 -> 3
        odd : 5 / 2 = 2 => 2 + 1 = 3
        even : 6 / 2 = 3 => 3 + 1 = 4
    */
    for (uint8_t cur_byte = 0; cur_byte < max; ++cur_byte)
    {
        uint8_t b = sha[cur_byte];
        if (cur_byte < max - 1)
        { // Before the last byte should be all zero
            if (b != 0)
                return false;
        }
        else if (isOdd)
        {
            if (b > 0x0F || b == 0)
                return false;
        }
        else if (b <= 0x0f)
            return false;
    }

    return true;
}

// Does the same as sprintf(char*, "%d%s", int, const char*) but a bit faster
__device__ uint8_t nonce_to_str(uint64_t nonce, unsigned char *out)
{
    uint64_t result = nonce;
    uint8_t remainder;
    uint8_t nonce_size = nonce == 0 ? 1 : floor(log10((double)nonce)) + 1;
    uint8_t i = nonce_size;
    while (result >= 10)
    {
        remainder = result % 10;
        result /= 10;
        out[--i] = remainder + '0';
    }

    out[0] = result + '0';
    i = nonce_size;
    out[i] = 0;
    return i;
}

struct Block
{
    char *blockid;
    char *prevhash;
    int difficulty;
    // int proof; //our implementation will directly inject proof value
    char *transactions; // JSON array
};

__device__ char *my_strcpy(char *dest, const char *src)
{
    int i = 0;
    do
    {
        dest[i] = src[i];
    } while (src[i++] != 0);
    return dest;
}

__device__ char *my_strcat(char *dest, const char *src)
{
    int i = 0;
    while (dest[i] != 0)
        i++;
    my_strcpy(dest + i, src);
    return dest;
}

__device__ void reverse(char str[], int length)
{
    int start = 0;
    int end = length - 1;
    while (start < end)
    {
        char tmp = *(str + start);
        *(str + start) = *(str + end);
        *(str + end) = tmp;
        start++;
        end--;
    }
}

__device__ char *itoa(uint64_t num, char *str)
{
    int i = 0;
    if (num == 0)
    {
        str[i++] = '0';
        str[i] = '\0';
        return str;
    }
    while (num != 0)
    {
        int rem = num % 10;
        str[i++] = (rem > 9) ? (rem - 10) + 'a' : rem + '0';
        num = num / 10;
    }
    str[i] = '\0';
    reverse(str, i);
    return str;
}

__device__ char *formJSONStr(char *dest, Block *block, uint64_t nonce)
{
    /*
    blockid,
    difficulty,
    prevhash,
    proof,
    transactions
    */
    my_strcat(dest, "{\"blockid\":\"");
    my_strcat(dest, block->blockid);
    my_strcat(dest, "\",\"difficulty\":");
    char diff[100];
    my_strcat(dest, itoa(block->difficulty, diff));
    my_strcat(dest, ",\"prevhash\":\"");
    my_strcat(dest, block->prevhash);
    my_strcat(dest, "\",\"proof\":");
    char noncestr[100];
    my_strcat(dest, itoa(nonce, noncestr));
    my_strcat(dest, ",\"transctions\":");
    my_strcat(dest, block->transactions);
    my_strcat(dest, "}");
    return dest;
}

extern __shared__ char array[];
__global__ void sha256_kernel(char *out_input_string_nonce, unsigned char *out_found_hash, int *out_found, const Block *in_input_string, size_t in_input_string_size, uint8_t difficulty, uint64_t nonce_offset)
{

    // If this is the first thread of the block, init the input block in shared memory
    Block *in;
    if (threadIdx.x == 0)
    {
        memcpy(in, in_input_string, in_input_string_size + 1);
    }

    __syncthreads(); // Ensure the input string has been written in SMEM

    uint64_t idx = blockIdx.x * blockDim.x + threadIdx.x;
    uint64_t nonce = idx + nonce_offset;

    // The first byte we can write because there is the input string at the begining
    // Respects the memory padding of 8 bit (char).
    size_t const minArray = static_cast<size_t>(ceil((in_input_string_size + 1) / 8.f) * 8);

    uintptr_t sha_addr = threadIdx.x * (64) + minArray;
    uintptr_t nonce_addr = sha_addr + 32;

    unsigned char *sha = (unsigned char *)&array[sha_addr];
    unsigned char *out = (unsigned char *)&array[nonce_addr];
    memset(out, 0, 32);

    uint8_t size = nonce_to_str(nonce, out);

    assert(size <= 32);

    {
        // unsigned char tmp[32];

        SHA256_CTX ctx;
        sha256_init(&ctx);
        // sha256_update(&ctx, out, size);
        char *dest = (char *)malloc(sizeof(char) * (1));
        dest[0] = '\0';
        //error here (todo: fix)
        sha256_update(&ctx, (unsigned char *)formJSONStr(dest, in, nonce), in_input_string_size);
        free(dest);
        sha256_final(&ctx, sha);

        // Second round of SHA256
        /*sha256_init(&ctx);
        sha256_update(&ctx, tmp, 32);
        sha256_final(&ctx, sha);*/
    }

    // atomicExch(out_found, 1);
    // memcpy(out_found_hash, sha, 32);
    // memcpy(out_input_string_nonce, out, size);
    // memcpy(out_input_string_nonce + size, in, in_input_string_size + 1);

    if (checkZeroPadding(sha, difficulty) && atomicExch(out_found, 1) == 0)
    { // if zero padding, checks if subbing *out_found with 1 is successful
        memcpy(out_found_hash, sha, 32);
        memcpy(out_input_string_nonce, out, size);
        memcpy(out_input_string_nonce + size, in, in_input_string_size + 1);
    }
}

void pre_sha256()
{
    checkCudaErrors(cudaMemcpyToSymbol(dev_k, host_k, sizeof(host_k), 0, cudaMemcpyHostToDevice));
}

// Prints a 32 bytes sha256 to the hexadecimal form filled with zeroes
void print_hash(const unsigned char *sha256)
{
    for (uint8_t i = 0; i < 32; ++i)
    {
        std::cout << std::hex << std::setfill('0') << std::setw(2) << static_cast<int>(sha256[i]);
    }
    std::cout << std::dec << std::endl;
}

void print_state()
{
    std::chrono::high_resolution_clock::time_point t2 = std::chrono::high_resolution_clock::now();

    std::chrono::duration<double, std::milli> last_show_interval = t2 - t_last_updated;

    if (last_show_interval.count() > SHOW_INTERVAL_MS)
    {
        std::chrono::duration<double, std::milli> span = t2 - t_last_updated;
        float ratio = span.count() / 1000;
        std::cout << span.count() << " " << nonce - last_nonce_since_update << std::endl;

        std::cout << std::fixed << static_cast<uint64_t>((nonce - last_nonce_since_update) / ratio) << " hash(es)/s" << std::endl;

        std::cout << std::fixed << "Nonce : " << nonce << std::endl;

        t_last_updated = std::chrono::high_resolution_clock::now();
        last_nonce_since_update = nonce;
    }

    if (*g_found)
    {
        std::cout << g_out << std::endl;
        print_hash(g_hash_out);
    }
}

static Block block;

int main()
{

    cudaSetDevice(0);
    cudaDeviceSetCacheConfig(cudaFuncCachePreferShared);

    t_last_updated = std::chrono::high_resolution_clock::now();

    

    std::string blockid;
    std::string prevhash;
    std::string transactions;
    std::cout << "Enter block ID : ";
    getline(std::cin, blockid);
    std::cout << "Enter previous block's hash : ";
    getline(std::cin, prevhash);
    std::cout << "Enter transactions JSON : ";
    getline(std::cin, transactions);
    std::cout << "Enter difficulty : ";
    std::cin >> difficulty;
    std::cout << std::endl;

    strcpy(block.blockid, blockid.c_str());
    strcpy(block.prevhash, prevhash.c_str());
    strcpy(block.transactions, transactions.c_str());
    block.difficulty = difficulty;

    const size_t input_size = sizeof(block);

    // Input string for the device
    char *d_in = nullptr;

    // Create the input string for the device
    cudaMalloc(&d_in, input_size + 1);
    cudaMemcpy(d_in, &block, input_size + 1, cudaMemcpyHostToDevice);

    cudaMallocManaged(&g_out, input_size + 32 + 1);
    cudaMallocManaged(&g_hash_out, 32);
    cudaMallocManaged(&g_found, sizeof(int));
    *g_found = 0;
    std::cout << &g_found << " " << *g_found << " " << g_found << "\n";

    nonce += user_nonce;
    last_nonce_since_update += user_nonce;

    pre_sha256();

    size_t dynamic_shared_size = (ceil((input_size + 1) / 8.f) * 8) + (64 * BLOCK_SIZE);

    std::cout << "Shared memory is " << dynamic_shared_size / 1024 << "KB" << std::endl;

    while (!*g_found)
    {
        //todo: modify to pass block data
        sha256_kernel<<<1, 1, dynamic_shared_size>>>(g_out, g_hash_out, g_found, &block, input_size, difficulty, nonce);

        cudaError_t err = cudaDeviceSynchronize();
        if (err != cudaSuccess)
        {
            throw std::runtime_error("Device error");
        }

        nonce += NUMBLOCKS * BLOCK_SIZE;

        print_state();
    }

    std::cout << &g_found << " " << *g_found << " " << g_found << "\n";

    cudaFree(g_out);
    cudaFree(g_hash_out);
    cudaFree(g_found);

    cudaFree(d_in);

    cudaDeviceReset();

    return 0;
}
