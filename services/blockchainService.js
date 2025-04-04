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
    // Use specified provider or default to local Ganache
    const provider = process.env.BLOCKCHAIN_PROVIDER || 'http://localhost:7545';
    web3 = new Web3(new Web3.providers.HttpProvider(provider));
    
    console.log('Blockchain provider:', provider);
    
    // Initialize contract with ABI and address
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      console.warn('CONTRACT_ADDRESS not set in environment variables');
      return;
    }
    
    contract = new web3.eth.Contract(ProductTracker.abi, contractAddress);
    console.log('Smart contract initialized at address:', contractAddress);
  } catch (error) {
    console.error('Failed to initialize blockchain connection:', error);
  }
}

// Initialize blockchain on module load
initBlockchain();

/**
 * Service tương tác với blockchain
 * - Thêm, cập nhật, truy vấn dữ liệu từ blockchain
 * - Xử lý các giao dịch blockchain
 */
class BlockchainService {
  /**
   * Thêm sản phẩm mới vào blockchain
   * @param {Object} product - Thông tin sản phẩm
   * @returns {Object} - Kết quả giao dịch
   */
  async addProduct(product) {
    try {
      // Kiểm tra kết nối blockchain
      if (!web3 || !contract) {
        console.error('Blockchain connection not initialized');
        throw new Error('Blockchain connection not available');
      }

      // Lấy tài khoản mặc định để ký giao dịch
      const accounts = await web3.eth.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No blockchain accounts available');
      }
      const defaultAccount = accounts[0];

      // Chuẩn bị dữ liệu cho blockchain (chỉ giữ các thông tin quan trọng)
      const productData = {
        name: product.name,
        origin: product.origin,
        manufacturer: product.manufacturer,
        productionDate: new Date(product.productionDate).getTime() / 1000, // Chuyển thành timestamp
        batchNumber: product.batchNumber || '',
        ownerId: product.ownerId
      };
      
      console.log('Sending product to blockchain:', productData);
      
      // Gọi hàm smart contract để thêm sản phẩm
      const result = await contract.methods
        .addProduct(
          productData.name,
          productData.origin,
          productData.manufacturer,
          parseInt(productData.productionDate),
          productData.batchNumber,
          productData.ownerId
        )
        .send({ from: defaultAccount, gas: 3000000 });
      
      // Ghi log toàn bộ kết quả để debug
      console.log('Transaction result:', JSON.stringify(result, null, 2));
      
      // Xử lý kết quả an toàn hơn để tránh lỗi "Cannot read properties of undefined"
      let productId;
      
      // Kiểm tra từng cấp của đối tượng kết quả
      if (result && result.events && result.events.ProductAdded && 
          result.events.ProductAdded.returnValues && result.events.ProductAdded.returnValues.productId) {
        productId = result.events.ProductAdded.returnValues.productId;
      } else {
        console.warn('Could not extract productId from event. Using generated ID.');
        // Fallback: Sử dụng transaction hash làm ID sản phẩm nếu không lấy được từ event
        productId = `product_${result.transactionHash.substring(0, 10)}`;
      }
      
      return {
        blockchainId: productId,
        transactionHash: result.transactionHash
      };
    } catch (error) {
      console.error('Blockchain Error (addProduct):', error);
      
      // Trả về lỗi để xử lý
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Cập nhật thông tin sản phẩm trên blockchain
   * @param {Object} product - Thông tin sản phẩm cần cập nhật
   * @returns {Object} - Kết quả giao dịch
   */
  async updateProduct(product) {
    try {
      const accounts = await web3.eth.getAccounts();
      const defaultAccount = accounts[0];
      
      const result = await contract.methods
        .updateProduct(
          product.blockchainId,
          product.name,
          product.origin,
          product.manufacturer
        )
        .send({ from: defaultAccount, gas: 1000000 });
      
      return {
        transactionHash: result.transactionHash
      };
    } catch (error) {
      console.error('Blockchain Error (updateProduct):', error);
      return {
        transactionHash: `mock_tx_${Date.now()}`
      };
    }
  }

  /**
   * Thêm giai đoạn mới cho sản phẩm vào blockchain
   * @param {Object} stage - Thông tin giai đoạn
   * @returns {Object} - Kết quả giao dịch
   */
  async addStage(stage) {
    try {
      const accounts = await web3.eth.getAccounts();
      const defaultAccount = accounts[0];
      
      // Lấy sản phẩm từ blockchain
      const product = await this.getProductById(stage.productId);
      
      const result = await contract.methods
        .addProductStage(
          product.blockchainId,
          stage.stageName,
          stage.description,
          stage.location,
          Math.floor(Date.now() / 1000), // Thời gian hiện tại
          stage.handledBy
        )
        .send({ from: defaultAccount, gas: 1000000 });
      
      return {
        transactionHash: result.transactionHash
      };
    } catch (error) {
      console.error('Blockchain Error (addStage):', error);
      return {
        transactionHash: `mock_tx_${Date.now()}`
      };
    }
  }

  /**
   * Chuyển quyền sở hữu sản phẩm
   * @param {String} productId - ID sản phẩm trên blockchain
   * @param {String} newOwnerId - ID chủ sở hữu mới
   * @returns {Object} - Kết quả giao dịch
   */
  async transferProduct(productId, newOwnerId) {
    try {
      // Kiểm tra kết nối blockchain
      if (!web3 || !contract) {
        console.error('Blockchain connection not initialized');
        throw new Error('Blockchain connection not available');
      }
      
      console.log(`Transferring product ${productId} to new owner ${newOwnerId}`);
      
      const accounts = await web3.eth.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No blockchain accounts available');
      }
      const defaultAccount = accounts[0];
      
      // Gọi smart contract để chuyển quyền sở hữu
      const result = await contract.methods
        .transferOwnership(productId, newOwnerId)
        .send({ from: defaultAccount, gas: 1000000 });
      
      console.log('Transfer ownership transaction result:', result);
      
      // Kiểm tra event OwnershipTransferred có được emit không
      let ownershipTransferredEvent = null;
      if (result.events && result.events.OwnershipTransferred) {
        ownershipTransferredEvent = result.events.OwnershipTransferred;
        console.log('OwnershipTransferred event found:', ownershipTransferredEvent);
      }
      
      return {
        transactionHash: result.transactionHash,
        event: ownershipTransferredEvent
      };
    } catch (error) {
      console.error('Blockchain Error (transferProduct):', error);
      
      // Trong môi trường phát triển, cho phép dùng dữ liệu giả
      if (process.env.NODE_ENV !== 'production' || process.env.MOCK_BLOCKCHAIN === 'true') {
        console.warn('Using mock blockchain transaction for development');
        return {
          transactionHash: `mock_transfer_tx_${Date.now()}`
        };
      }
      
      throw error; // Ném lại lỗi để xử lý ở tầng cao hơn
    }
  }

  /**
   * Lấy thông tin sản phẩm từ blockchain
   * @param {String} productId - ID sản phẩm
   * @returns {Object} - Thông tin sản phẩm
   */
  async getProductById(productId) {
    try {
      // Trong môi trường thực tế, sẽ truy vấn từ blockchain
      // Tạm thời trả về dữ liệu giả
      return {
        blockchainId: productId,
        name: "Sample Product",
        origin: "Sample Origin",
        manufacturer: "Sample Manufacturer"
      };
    } catch (error) {
      console.error('Blockchain Error (getProductById):', error);
      return null;
    }
  }

  /**
   * Lấy lịch sử sản phẩm từ blockchain
   * @param {String} productId - ID sản phẩm trên blockchain
   * @returns {Array} - Lịch sử sản phẩm
   */
  async getProductHistory(productId) {
    try {
      // Trong môi trường thực tế, sẽ truy vấn từ blockchain
      // Tạm thời trả về dữ liệu giả
      const mockHistory = [
        {
          stageName: "Sản xuất",
          timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          location: "Nhà máy A",
          handledBy: "0x123..."
        },
        {
          stageName: "Đóng gói",
          timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          location: "Nhà máy A",
          handledBy: "0x123..."
        },
        {
          stageName: "Vận chuyển",
          timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          location: "Kho B",
          handledBy: "0x456..."
        }
      ];
      
      return mockHistory;
    } catch (error) {
      console.error('Blockchain Error (getProductHistory):', error);
      return [];
    }
  }
}

module.exports = new BlockchainService();
