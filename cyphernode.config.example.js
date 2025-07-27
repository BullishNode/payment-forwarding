// Cyphernode Configuration Example
// Copy this to cyphernode.config.js and update with your values

module.exports = {
  // Cyphernode instance URL
  baseUrl: 'https://your-cyphernode-instance.com',
  
  // API credentials
  apiId: 'your_cyphernode_api_id',
  apiKey: 'your_cyphernode_api_key',
  
  // Optional: Network configuration
  network: 'mainnet', // or 'testnet'
  
  // Optional: Default confirmation target for transactions
  defaultConfTarget: 6,
  
  // Optional: SSL configuration
  ssl: {
    rejectUnauthorized: false, // Set to true for production with valid certs
    ca: null // Path to CA certificate if needed
  }
}
