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
      const product = await this.getProductById(stage.blockchainId);
      if(!product){
        throw new Error(`Không tìm thấy sản phẩm với ID ${stage.productId}`);
      }
      // Xử lý đặc biệt cho giai đoạn tạo QR
      const stageName = stage.stageName === 'qr_generated' ? 'QR Code Created' : stage.stageName;
      
      const result = await contract.methods
        .addProductStage(
          product.blockchainId,
          stageName,
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
      throw new Error(`Blockchain transaction failed: ${error.message}`);
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
      // Kiểm tra kết nối blockchain
      if (!web3 || !contract) {
        throw new Error('Blockchain connection not available');
      }
      const productData = await contract.methods.getProduct(productId).call();
      // Kiểm tra xem sản phẩm có tồn tại không
      if(!productData || !productData.exists) {
        console.warn(`Product with ID ${productId} does not exist on blockchain`);
        return null;
      }
      // Chuyển đổi dữ liệu từ contract về dạng đối tượng
      return {
        blockchainId: productId,
        name: productData.name,
        origin: productData.origin,
        manufacturer: productData.manufacturer,
        productionDate: new Date(productData.productionDate * 1000),
        batchNumber: productData.batchNumber,
        ownerId: productData.ownerId
      };
    }catch (error) {
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
      // Kiểm tra kết nối blockchain
      if (!web3 || !contract) {
        throw new Error('Blockchain connection not available');
      }
      
      // Lấy số lượng giai đoạn của sản phẩm
      const historyCount = await contract.methods.getProductHistoryCount(productId).call();
      const history = [];
      
      // Lấy chi tiết từng giai đoạn
      for (let i = 0; i < parseInt(historyCount); i++) {
        const stage = await contract.methods.getProductHistoryItem(productId, i).call();
        
        history.push({
          stageName: stage.stageName,
          description: stage.description,
          location: stage.location,
          timestamp: new Date(parseInt(stage.timestamp) * 1000),
          handledBy: stage.handler
        });
      }
      
      return history;
    } catch (error) {
      console.error('Blockchain Error (getProductHistory):', error);
      return [];
    }
  }

  /**
   * Lấy hash của sản phẩm từ blockchain
   * @param {string} blockchainId - ID sản phẩm trên blockchain
   * @returns {string|null} - Hash của sản phẩm hoặc null nếu không tìm thấy
   */
  async getProductHash(blockchainId) {
    try {
      // Lấy dữ liệu sản phẩm từ blockchain
      const productData = await this.getProductById(blockchainId);
      if (!productData) return null;
      
      // Tạo chuỗi JSON đã sắp xếp để tính hash nhất quán
      const dataToHash = {
        name: productData.name,
        manufacturer: productData.manufacturer,
        origin: productData.origin,
        description: productData.description || '',
        batchNumber: productData.batchNumber || '',
        productionDate: new Date(productData.productionDate).toISOString().split('T')[0]
      };
      
      // Tính hash từ dữ liệu
      const dataString = JSON.stringify(dataToHash, Object.keys(dataToHash).sort());
      return web3.utils.sha3(dataString);
    } catch (error) {
      console.error('Blockchain Error (getProductHash):', error);
      return null;
    }
  }

  /**
   * Lấy dữ liệu gốc của sản phẩm từ blockchain
   * @param {String} blockchainId - ID sản phẩm trên blockchain
   * @returns {Object} - Dữ liệu gốc hoặc null nếu không tìm thấy
   */
  async getOriginalProductData(blockchainId) {
    try {
      // Gọi smart contract method để lấy dữ liệu gốc
      const productData = await contract.methods
        .getProduct(blockchainId)
        .call();
      
      if (productData && productData.exists) {
        // Chuyển đổi dữ liệu từ blockchain về định dạng phù hợp
        return {
          name: productData.name,
          manufacturer: productData.manufacturer,
          origin: productData.origin,
          description: productData.description || '',
          batchNumber: productData.batchNumber || '',
          productionDate: new Date(productData.productionDate * 1000), // Chuyển đổi timestamp
          expiryDate: productData.expiryDate ? new Date(productData.expiryDate * 1000) : null
        };
      }
      return null;
    } catch (error) {
      console.error('Blockchain Error (getOriginalProductData):', error);
      return null;
    }
  }
}

module.exports = new BlockchainService();
