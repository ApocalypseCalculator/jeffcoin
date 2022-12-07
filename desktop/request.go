package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"time"
)

var httpClient = &http.Client{Timeout: 10 * time.Second}

func httpGetRequest(url string, target interface{}) error {
	r, err := httpClient.Get(url)
	if err != nil {
		return err
	}
	defer r.Body.Close()

	return json.NewDecoder(r.Body).Decode(target)
}

func httpPostRequest(url string, target interface{}, content []byte) error {
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(content))
	req.Header.Set("Content-Type", "application/json")
	r, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer r.Body.Close()
	return json.NewDecoder(r.Body).Decode(target)
}
