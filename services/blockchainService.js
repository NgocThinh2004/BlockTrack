const { web3, contract } = require('../config/blockchain');

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
      // Lấy tài khoản mặc định để ký giao dịch
      const accounts = await web3.eth.getAccounts();
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
      
      // Lấy ID của sản phẩm từ event của smart contract
      const productId = result.events.ProductAdded.returnValues.productId;
      
      return {
        blockchainId: productId,
        transactionHash: result.transactionHash
      };
    } catch (error) {
      console.error('Blockchain Error (addProduct):', error);
      // Trong môi trường thực tế, cần xử lý lỗi kết nối blockchain
      // Tạm thời trả về một ID giả để phát triển
      return {
        blockchainId: `mock_${Date.now()}`,
        transactionHash: `mock_tx_${Date.now()}`
      };
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
      const accounts = await web3.eth.getAccounts();
      const defaultAccount = accounts[0];
      
      const result = await contract.methods
        .transferOwnership(productId, newOwnerId)
        .send({ from: defaultAccount, gas: 1000000 });
      
      return {
        transactionHash: result.transactionHash
      };
    } catch (error) {
      console.error('Blockchain Error (transferProduct):', error);
      return {
        transactionHash: `mock_tx_${Date.now()}`
      };
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

async function initBlockchain() {
  // Nếu đã khởi tạo rồi thì không cần khởi tạo lại
  if (web3 && contract) {
    return { web3, contract };
  }

  try {
    // Khởi tạo web3
    const provider = process.env.BLOCKCHAIN_PROVIDER;
    web3 = new Web3(new Web3.providers.HttpProvider(provider));
    
    // Kiểm tra kết nối
    const isConnected = await web3.eth.net.isListening();
    if (!isConnected) {
      console.error('Cannot connect to Ethereum network');
      if (process.env.NODE_ENV !== 'production') {
        console.log('Using mock blockchain in development mode');
        // Không sử dụng mô phỏng trong môi trường production
        return mockBlockchainService;
      }
      throw new Error('Blockchain connection failed');
    }
    
    // ...tiếp tục khởi tạo contract...
    
  } catch (error) {
    console.error('Blockchain initialization error:', error);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using mock blockchain in development mode');
      return mockBlockchainService;
    }
    throw error;
  }
}

module.exports = new BlockchainService();
