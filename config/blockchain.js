const Web3 = require('web3');
const ProductTracker = require('../contracts/compiled/ProductTracker.json');
const dotenv = require('dotenv');

dotenv.config();

// Configuration for blockchain connection
let web3;
let contract;

/**
 * Initialize blockchain connection
 * - In development: Connect to local blockchain (Ganache)
 * - In production: Connect to specified provider
 */
function initBlockchain() {
  try {
    // Default to local development blockchain if no provider is specified
    const provider = process.env.BLOCKCHAIN_PROVIDER || 'http://localhost:7545';
    
    // Create a new Web3 instance
    web3 = new Web3(new Web3.providers.HttpProvider(provider));
    
    console.log('Blockchain connection established to:', provider);
    
    // Get the contract address from environment variables
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      console.warn('CONTRACT_ADDRESS not set in environment variables. Using mock mode.');
      return;
    }
    
    // Create a new contract instance
    contract = new web3.eth.Contract(
      ProductTracker.abi,
      contractAddress
    );
    
    console.log('Smart contract loaded at address:', contractAddress);
  } catch (error) {
    console.error('Failed to initialize blockchain connection:', error);
    // Create a mock Web3 instance to allow development without blockchain
    console.log('Running in mock blockchain mode for development');
    web3 = {
      eth: {
        getAccounts: async () => ['0x1234567890123456789012345678901234567890'],
        Contract: function() {
          return {
            methods: {
              addProduct: () => ({
                send: async () => ({ 
                  transactionHash: `mock_tx_${Date.now()}`,
                  events: { 
                    ProductAdded: { 
                      returnValues: { productId: `mock_${Date.now()}` } 
                    } 
                  }
                })
              }),
              addProductStage: () => ({
                send: async () => ({ transactionHash: `mock_tx_${Date.now()}` })
              }),
              updateProduct: () => ({
                send: async () => ({ transactionHash: `mock_tx_${Date.now()}` })
              }),
              transferOwnership: () => ({
                send: async () => ({ transactionHash: `mock_tx_${Date.now()}` })
              }),
              getProduct: () => ({
                call: async () => ({
                  name: 'Mock Product',
                  origin: 'Mock Origin',
                  manufacturer: 'Mock Manufacturer',
                  productionDate: Math.floor(Date.now() / 1000) - 86400,
                  exists: true
                })
              }),
              getProductHistoryCount: () => ({
                call: async () => 3
              }),
              getProductHistoryItem: () => ({
                call: async () => ({
                  stageName: 'production',
                  description: 'Mock stage description',
                  location: 'Mock location',
                  timestamp: Math.floor(Date.now() / 1000) - 86400,
                  handler: 'Mock handler'
                })
              })
            }
          };
        }
      }
    };
    contract = new web3.eth.Contract();
  }
}

// Initialize blockchain on module load
initBlockchain();

module.exports = { web3, contract };
