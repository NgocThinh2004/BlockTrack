const Web3 = require('web3');
const ProductTracker = require('../contracts/compiled/ProductTracker.json');
const dotenv = require('dotenv');

dotenv.config();

// Cấu hình kết nối blockchain
let web3;
let contract;

/**
 * Khởi tạo kết nối blockchain
 * - Trong môi trường phát triển: Kết nối đến blockchain cục bộ (Ganache)
 * - Trong môi trường sản xuất: Kết nối đến provider được chỉ định
 */
function initBlockchain() {
  try {
    // Mặc định kết nối đến blockchain phát triển cục bộ nếu không có provider nào được chỉ định
    const provider = process.env.BLOCKCHAIN_PROVIDER || 'http://localhost:7545';
    
    // Tạo một instance Web3 mới
    web3 = new Web3(new Web3.providers.HttpProvider(provider));
    
    console.log('Đã thiết lập kết nối blockchain đến:', provider);
    
    // Lấy địa chỉ hợp đồng từ biến môi trường
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      console.error('CONTRACT_ADDRESS không được cấu hình trong biến môi trường.');
      throw new Error('Địa chỉ smart contract không được cấu hình');
    }
    
    // Tạo một instance hợp đồng mới
    contract = new web3.eth.Contract(
      ProductTracker.abi,
      contractAddress
    );
    
    console.log('Đã tải smart contract tại địa chỉ:', contractAddress);
  } catch (error) {
    console.error('Không thể khởi tạo kết nối blockchain:', error);
    throw new Error('Không thể kết nối đến blockchain. Vui lòng kiểm tra cấu hình.');
  }
}

// Khởi tạo blockchain khi module được tải
initBlockchain();

module.exports = { web3, contract };