# Cyphernode Integration for BullPay

This document describes the Cyphernode integration for BullPay functionality.

## Overview

The BullPay integration uses Cyphernode to:
1. Validate Liquid wallet descriptors before store creation
2. Send Bitcoin payments to Liquid Network addresses

## Configuration

### Environment Variables

Set these environment variables for Cyphernode integration:

```bash
cyphernodeBaseUrl=https://your-cyphernode-instance.com
cyphernodeApiId=your_cyphernode_api_id
cyphernodeApiKey=your_cyphernode_api_key
```

### API Endpoints Required

Your Cyphernode instance must support these endpoints:

#### 1. Validate Liquid Descriptor
- **Endpoint:** `POST /validateLiquidDescriptor`
- **Request:** `{ "descriptor": "ct(slip77(...),elwpkh([...]xpub...))" }`
- **Response:** `{ "valid": true }` or `{ "valid": false, "error": "message" }`

#### 2. Spend to Liquid Descriptor
- **Endpoint:** `POST /spendToLiquidDescriptor`
- **Request:** 
  ```json
  {
    "amount": 0.001,
    "descriptor": "ct(slip77(...),elwpkh([...]xpub...))",
    "confTarget": 6
  }
  ```
- **Response:**
  ```json
  {
    "status": "accepted",
    "hash": "txid_here",
    "address": "liquid_address_here",
    "details": {
      "txid": "txid_here",
      "liquid_address": "liquid_address_here",
      "fee": 0.00001524,
      "vsize": 141,
      "confirmations": 0,
      "block_height": null,
      "broadcast_time": "2024-01-25T14:30:00.000Z"
    }
  }
  ```

## Security

- JWT authentication with HMAC SHA256
- Token expiration (10 seconds)
- SSL/TLS support with certificate handling
- Configurable certificate validation

## Error Handling

The client provides comprehensive error handling for:
- Network connectivity issues
- Authentication failures
- Invalid API responses
- Malformed descriptors
- Insufficient funds

## Testing

To test the integration:

1. Configure environment variables
2. Create a BullPay store with liquidWalletDescriptor
3. Generate and pay an invoice
4. Verify Liquid transaction appears in explorer

## Troubleshooting

Common issues:
- Check Cyphernode API credentials
- Verify network connectivity
- Ensure API endpoints are available
- Check Liquid descriptor format
- Verify sufficient Bitcoin balance

## Example Usage

### Validate Descriptor
```javascript
const client = new CyphernodeBullPayClient(baseUrl, apiId, apiKey)
const result = await client.validateLiquidDescriptor(descriptor)
if (result.isValid) {
  console.log('Descriptor is valid')
} else {
  console.log('Invalid descriptor:', result.error)
}
```

### Send Payment
```javascript
const paymentResult = await client.liquidPayment(0.001, descriptor)
if (paymentResult && paymentResult.hash) {
  console.log('Payment sent:', paymentResult.hash)
  console.log('Liquid address:', paymentResult.address)
} else {
  console.log('Payment failed')
}
```
