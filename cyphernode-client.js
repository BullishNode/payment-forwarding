const crypto = require("crypto")
const fetch = require('node-fetch')

class CyphernodeBullPayClient {
  constructor(baseURL, apiID, apiKey) {
    this.baseURL = baseURL;
    this.h64 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9Cg==';
    this.apiId = apiID;
    this.apiKey = apiKey;
  }

  _generateToken() {
    console.log("CyphernodeBullPayClient._generateToken")

    let current = Math.round(new Date().getTime()/1000) + 10
    let p = '{"id":"' + this.apiId + '","exp":' + current + '}'
    let p64 = Buffer.from(p).toString('base64')
    let msg = this.h64 + '.' + p64
    let s = crypto.createHmac('sha256', this.apiKey).update(msg).digest('hex');
    let token = msg + '.' + s

    return token
  }

  async _postRequest(url, postdata) {
    console.log("CyphernodeBullPayClient._postRequest", url, JSON.stringify(postdata))

    const fullUrl = this.baseURL + url;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this._generateToken()
      },
      body: JSON.stringify(postdata),
      // Handle self-signed certificates
      agent: false,
      rejectUnauthorized: false
    }

    try {
      const response = await fetch(fullUrl, options)
      
      if (!response.ok) {
        console.log('Cyphernode API response not ok:', response.status, response.statusText)
        return { 
          err: `HTTP ${response.status}: ${response.statusText}`, 
          body: null 
        }
      }

      const data = await response.json()
      console.log("CyphernodeBullPayClient._postRequest :: response:", JSON.stringify(data))

      return { 
        err: data.message || null, 
        body: data 
      }
    } catch (error) {
      console.error("CyphernodeBullPayClient._postRequest :: error:", error)
      return { 
        err: error.message, 
        body: null 
      }
    }
  }

  /**
   * Validates a Liquid wallet descriptor format
   * @param {string} descriptor - The Liquid wallet descriptor to validate
   * @returns {Promise<{isValid: boolean, error: string|null}>}
   */
  async validateLiquidDescriptor(descriptor) {
    console.log("CyphernodeBullPayClient.validateLiquidDescriptor", descriptor)

    if (!descriptor || typeof descriptor !== 'string') {
      return { 
        isValid: false, 
        error: "Descriptor must be a non-empty string" 
      }
    }

    // Call Cyphernode API to validate the descriptor
    const result = await this._postRequest('/validateLiquidDescriptor', { 
      descriptor: descriptor 
    })

    if (result.err) {
      return { 
        isValid: false, 
        error: result.err 
      }
    }

    // Expected Cyphernode response format: { "valid": true } or { "valid": false, "error": "message" }
    if (result.body && result.body.valid === true) {
      return { 
        isValid: true, 
        error: null 
      }
    } else {
      return { 
        isValid: false, 
        error: result.body?.error || "Invalid descriptor format" 
      }
    }
  }

  /**
   * Sends Bitcoin to a Liquid wallet descriptor
   * @param {number} btcAmount - Amount of Bitcoin to send
   * @param {string} liquidDescriptor - Target Liquid wallet descriptor
   * @returns {Promise<{hash: string, address: string, status: string, details: object}|null>}
   */
  async liquidPayment(btcAmount, liquidDescriptor) {
    console.log("CyphernodeBullPayClient.liquidPayment", btcAmount, liquidDescriptor)

    if (!btcAmount || btcAmount <= 0) {
      console.error("Invalid BTC amount:", btcAmount)
      return null
    }

    if (!liquidDescriptor || typeof liquidDescriptor !== 'string') {
      console.error("Invalid liquid descriptor:", liquidDescriptor)
      return null
    }

    // Call Cyphernode API to spend Bitcoin to the Liquid descriptor
    const result = await this._postRequest('/spendToLiquidDescriptor', {
      amount: btcAmount,
      descriptor: liquidDescriptor,
      confTarget: 6  // Optional: confirmation target for fee estimation
    })

    if (result.err) {
      console.error("Cyphernode liquidPayment error:", result.err)
      return null
    }

    // Expected Cyphernode response format: 
    // { "status": "accepted", "hash": "txid", "address": "liquid_address", "details": {...} }
    if (result.body && result.body.status === "accepted" && result.body.hash) {
      return {
        hash: result.body.hash,
        address: result.body.address, // Liquid address
        status: result.body.status,
        details: {
          amount: btcAmount,
          descriptor: liquidDescriptor,
          txid: result.body.hash,
          liquid_address: result.body.address,
          timestamp: new Date().toISOString(),
          mempoolUrl: `https://blockstream.info/liquid/tx/${result.body.hash}`,
          ...result.body.details
        }
      }
    } else {
      console.error("Unexpected Cyphernode response format:", result.body)
      return null
    }
  }
}

module.exports = CyphernodeBullPayClient
