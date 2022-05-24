package cloudflare

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Client contains an API client
type Client struct {
	authEmail string
	authKey   string
	serverURL string
	runDomain string
	zoneId    string

	httpClient *http.Client
}

type RecordData struct {
	Type    string `json:"type"`
	Name    string `json:"name"`
	Content string `json:"content"`
	Proxied bool   `json:"proxied"`
}

// NewClient creates a new bind API client
func NewClient(serverURL, authEmail, authKey, runDomain string, zoneId string) *Client {

	fmt.Println(fmt.Sprintf("[DBEUG] Initialize Cloudflare client"))

	httpClient := &http.Client{
		Timeout: time.Minute,
	}

	return &Client{authEmail, authKey, serverURL, runDomain, zoneId, httpClient}
}

// CreateCNAMERecord creates a new CNAME record for the nameserver
func (c *Client) CreateCNAMERecord(value, hostname string) error {
	valueC := canonicalize(value)
	hostnameC := canonicalize(hostname)

	fmt.Println(fmt.Sprintf("[DEBUG] value: %v", valueC))
	fmt.Println(fmt.Sprintf("[DEBUG] hostname: %v", hostnameC))

	return c.sendRequest(http.MethodPost, &RecordData{
		Name:    hostnameC,
		Type:    "CNAME",
		Proxied: true,
		Content: valueC,
	})
}

// CreateARecord creates a new A record for the nameserver
func (c *Client) CreateARecord(value, hostname string) error {
	hostnameC := canonicalize(hostname)

	fmt.Println(fmt.Sprintf("[DEBUG] hostname: %v", hostnameC))

	return c.sendRequest(http.MethodPost, &RecordData{
		Name:    hostnameC,
		Type:    "A",
		Proxied: true,
		Content: value,
	})
}

func canonicalize(value string) string {
	// if the string ends in a period, return
	if value[len(value)-1:] == "." {
		return value
	}

	return fmt.Sprintf("%s.", value)
}

func (c *Client) sendRequest(method string, data *RecordData) error {
	reqURL, err := url.Parse(c.serverURL)

	if err != nil {
		return nil
	}

	reqURL.Path = fmt.Sprintf("/client/v4/zones/%s/dns_records", c.zoneId)

	strData, err := json.Marshal(data)

	if err != nil {
		return err
	}

	req, err := http.NewRequest(
		method,
		reqURL.String(),
		strings.NewReader(string(strData)),
	)

	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	req.Header.Set("Accept", "application/json; charset=utf-8")
	req.Header.Set("X-Auth-Key", c.authKey)
	req.Header.Set("X-Auth-Email", c.authEmail)

	res, err := c.httpClient.Do(req)

	if err != nil {
		return err
	}

	defer res.Body.Close()

	if res.StatusCode < http.StatusOK || res.StatusCode >= http.StatusBadRequest {
		resBytes, err := ioutil.ReadAll(res.Body)

		if err != nil {
			return fmt.Errorf("request failed with status code %d, but could not read body (%s)\n", res.StatusCode, err.Error())
		}

		return fmt.Errorf("request failed with status code %d: %s\n", res.StatusCode, string(resBytes))
	}

	return nil
}
