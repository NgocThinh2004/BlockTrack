module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,           // Port mặc định của Ganache UI
      network_id: "*",
      gas: 6500000,         // Giới hạn gas (phải nhỏ hơn block gas limit của Ganache)
      gasPrice: 20000000000 // 20 gwei
    }
  },
  
  // Chỉ định thư mục contracts và compiled
  contracts_directory: './contracts/',
  contracts_build_directory: './contracts/compiled/',
  
  // Cấu hình compiler
  compilers: {
    solc: {
      version: "0.8.17",    // Chỉ định phiên bản rõ ràng
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};