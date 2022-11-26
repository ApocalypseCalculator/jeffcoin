//Jeffcoin miner

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
#include <stdio.h>

#include "sha256.cuh"

#define SHOW_INTERVAL_MS 2000
#define SHA_PER_ITERATIONS 8'388'608
//#define BLOCK_SIZE 256
//#define NUMBLOCKS (SHA_PER_ITERATIONS + BLOCK_SIZE - 1) / BLOCK_SIZE

//these hardcoded values work
//todo: fix to not 700 illegal mem access for larger values (only 700s for long input strings)
#define BLOCK_SIZE 128
#define NUMBLOCKS 128

static size_t difficulty = 1;

// Output string by the device read by host
unsigned char *g_hash_out = nullptr;
int *g_found = nullptr;
int *g_foundval = nullptr;

static uint64_t nonce = 0;
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

__device__ int my_strlen(char *src)
{
    int i = 0;
    while (src[i++] != 0)
        ;
    return i - 1;
}

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

__device__ char *formJSONStr(char *dest, char *blockid, char *prevhash, char *transactions,  char *difficulty,  char *nonce)
{
    /*
    blockid, (block id str)
    difficulty, (itoa'd difficulty level)
    prevhash, (last hash hex str)
    proof, (itoa'd nonce val)
    transactions (JSON arr)
    */
    my_strcat(dest, "{\"blockid\":\"");
    my_strcat(dest, blockid);
    my_strcat(dest, "\",\"difficulty\":");
    my_strcat(dest, difficulty);
    my_strcat(dest, ",\"prevhash\":\"");
    my_strcat(dest, prevhash);
    my_strcat(dest, "\",\"proof\":");
    my_strcat(dest, nonce);
    my_strcat(dest, ",\"transactions\":");
    my_strcat(dest, transactions);
    my_strcat(dest, "}");
    return dest;
}

extern __shared__ char array[];
__global__ void sha256_kernel(unsigned char *out_found_hash, int *out_found, int *out_foundval, const char *in_blockid, const char *in_prevhash, const char *in_transactions, size_t in_bidsize, size_t in_bphashsize, size_t in_btranssize, size_t in_block_size, uint8_t difficulty, uint64_t nonce_offset)
{
    char *in_bid = (char *)&array[0]; //inputted block id is first in SMEM
    char *in_bphash = (char *)&array[in_bidsize + 1]; //fetch block prevhash from SMEM offset
    char *in_btrans = (char *)&array[in_bidsize + in_bphashsize + 2]; //fetch block transaction list from SMEM offset

    // If this is the first thread of the block, init the input block data in shared memory
    if (threadIdx.x == 0)
    {
        my_strcpy(in_bid, in_blockid);
        my_strcpy(in_bphash, in_prevhash);
        my_strcpy(in_btrans, in_transactions);
    }

    __syncthreads(); // Ensure the input block has been written in SMEM

    uint64_t idx = blockIdx.x * blockDim.x + threadIdx.x;
    uint64_t nonce = idx + nonce_offset;

    char *sha_tmp = (char *)malloc(sizeof(char) * (32));
    sha_tmp[0] = '\0';
    unsigned char *sha = (unsigned char *)sha_tmp;

    {
        SHA256_CTX ctx;
        sha256_init(&ctx);

        char diff[32];
        itoa(difficulty, diff);
        char noncestr[32];
        itoa(nonce, noncestr);

        // very hacky allocation size calculation
        size_t destsize = my_strlen(in_bid) + my_strlen(in_bphash) + my_strlen(in_btrans) + my_strlen(diff) + my_strlen(noncestr) + 12 + 15 + 13 + 10 + 16 + 1;

        char *dest = (char *)malloc(sizeof(char) * (destsize));
        dest[0] = '\0'; //null byte

        //create JSON string to hash
        formJSONStr(dest, in_bid, in_bphash, in_btrans, diff, noncestr);

        sha256_update(&ctx, (unsigned char *)dest, sizeof(char) * destsize);

        free(dest);
        
        sha256_final(&ctx, sha);
    }

    if (checkZeroPadding(sha, difficulty) && atomicExch(out_found, 1) == 0 && atomicExch(out_foundval, nonce) == 0)
    { // if zero padding, checks if subbing *out_found with 1 is successful
        memcpy(out_found_hash, sha, 32);
    }
    free(sha_tmp);
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

        std::cout << std::fixed << static_cast<uint64_t>((nonce - last_nonce_since_update) / ratio) << " hash(es)/s" << std::endl;

        std::cout << std::fixed << "Current Nonce : " << nonce << std::endl;

        t_last_updated = std::chrono::high_resolution_clock::now();
        last_nonce_since_update = nonce;
    }

    if (*g_found)
    {
        print_hash(g_hash_out);
        std::cout << std::fixed << "Final Nonce : " << *g_foundval << std::endl;
    }
}

int main(int argc, char* argv[])
{

    cudaSetDevice(0);
    cudaDeviceSetCacheConfig(cudaFuncCachePreferShared);

    t_last_updated = std::chrono::high_resolution_clock::now();

    std::string blockid;
    std::string prevhash;
    std::string transactions;
    if(argc < 5) {
        std::cout << "Invalid arguments" << std::endl;
        return 1;
    }
    //std::cout << argv[1] << "\n" << argv[2] << "\n" << argv[3] << "\n" << argv[4] << "\n";
    blockid.assign(argv[1]);
    prevhash.assign(argv[2]);
    transactions.assign(argv[3]);
    try {
        difficulty = std::stoi(argv[4]);
    }
    catch(std::exception const &e) {
        std::cout << "Invalid difficulty" << std::endl;
        return 1;
    }
    /*std::cout << "Enter block ID : ";
    getline(std::cin, blockid);
    std::cout << "Enter previous block's hash : ";
    getline(std::cin, prevhash);
    std::cout << "Enter transactions JSON : ";
    getline(std::cin, transactions);
    std::cout << "Enter difficulty : ";
    std::cin >> difficulty;
    std::cout << std::endl;*/

    char *d_in_blockid = nullptr;
    cudaMalloc(&d_in_blockid, blockid.size() + 1);
    cudaMemcpy(d_in_blockid, blockid.c_str(), blockid.size() + 1, cudaMemcpyHostToDevice);

    char *d_in_prevhash = nullptr;
    cudaMalloc(&d_in_prevhash, prevhash.size() + 1);
    cudaMemcpy(d_in_prevhash, prevhash.c_str(), prevhash.size() + 1, cudaMemcpyHostToDevice);

    char *d_in_transactions = nullptr;
    cudaMalloc(&d_in_transactions, transactions.size() + 1);
    cudaMemcpy(d_in_transactions, transactions.c_str(), transactions.size() + 1, cudaMemcpyHostToDevice);

    cudaMallocManaged(&g_hash_out, 32);
    cudaMallocManaged(&g_found, sizeof(int));
    *g_found = 0;
    cudaMallocManaged(&g_foundval, sizeof(int));
    *g_foundval = 0;

    pre_sha256();

    const size_t totalInpSize = blockid.size() + prevhash.size() + transactions.size();

    //std::cout << totalInpSize << " (inp size)\n";

    size_t dynamic_shared_size = (ceil((totalInpSize + 1 + 1 + 1) / 8.f) * 8) + (64 * BLOCK_SIZE);

    std::cout << "Shared memory is " << dynamic_shared_size / 1024 << "KB" << std::endl;

    while (!*g_found)
    {
        sha256_kernel<<<NUMBLOCKS, BLOCK_SIZE, dynamic_shared_size>>>(g_hash_out, g_found, g_foundval, d_in_blockid, d_in_prevhash, d_in_transactions, blockid.size(), prevhash.size(), transactions.size(), totalInpSize, difficulty, nonce);
        //cudaError_t err1 = cudaGetLastError();
        cudaError_t err = cudaDeviceSynchronize();
        if (err != cudaSuccess)
        {
            std::cout << err << std::endl;
            throw std::runtime_error("Device error");
        }

        nonce += NUMBLOCKS * BLOCK_SIZE;

        print_state();
    }

    cudaFree(g_hash_out);
    cudaFree(g_found);
    cudaFree(g_foundval);

    cudaFree(d_in_blockid);
    cudaFree(d_in_prevhash);
    cudaFree(d_in_transactions);

    cudaDeviceReset();

    return 0;
}
