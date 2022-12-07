package main

type LoginResp struct {
	Token string `json:"token"`
}

type UserData struct {
	Token      string `json:"token"`
	Userid     string `json:"userid"`
	Username   string `json:"username"`
	Registered int64  `json:"registertime"`
}

type CacheData struct {
	User   UserData `json:"user"`
	Server string   `json:"server"`
}
