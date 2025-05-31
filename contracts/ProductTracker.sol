// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract ProductTracker {
    // Cấu trúc dữ liệu sản phẩm
    struct Product {
        string name;
        string origin;
        string manufacturer;
        uint256 productionDate;
        string batchNumber;
        string ownerId;
        bool exists;
    }
    
    // Cấu trúc dữ liệu giai đoạn
    struct Stage {
        string stageName;
        string description;
        string location;
        uint256 timestamp;
        string handler;
    }
    
    // Lưu trữ sản phẩm theo ID
    mapping(string => Product) private products;
    
    // Lưu trữ lịch sử sản phẩm
    mapping(string => Stage[]) private productHistory;
    
    // Events - Đã sửa string indexed thành bytes32 indexed
    event ProductAdded(bytes32 indexed productIdHash, string productId, address indexed manufacturer);
    event StageAdded(bytes32 indexed productIdHash, string productId, string stageName, uint256 timestamp);
    event OwnershipTransferred(bytes32 indexed productIdHash, string productId, string newOwnerId);
    
    constructor() {}
    
    // Thêm sản phẩm mới
    function addProduct(
        string memory _name,
        string memory _origin,
        string memory _manufacturer,
        uint256 _productionDate,
        string memory _batchNumber,
        string memory _ownerId
    ) public returns (string memory) {
        // Tạo ID cho sản phẩm
        string memory productId = generateProductId(_name, _manufacturer, _productionDate);
        
        // Kiểm tra sản phẩm đã tồn tại chưa
        require(!products[productId].exists, "San pham da ton tai");
        
        // Lưu thông tin sản phẩm
        products[productId] = Product({
            name: _name,
            origin: _origin,
            manufacturer: _manufacturer,
            productionDate: _productionDate,
            batchNumber: _batchNumber,
            ownerId: _ownerId,
            exists: true
        });
        
        // Thêm giai đoạn đầu tiên
        Stage memory initialStage = Stage({
            stageName: "production",
            description: "San pham vua duoc tao",
            location: _origin,
            timestamp: block.timestamp,
            handler: _ownerId
        });
        
        productHistory[productId].push(initialStage);
        
        // Phát sự kiện với hash của productId
        bytes32 productIdHash = keccak256(abi.encodePacked(productId));
        emit ProductAdded(productIdHash, productId, msg.sender);
        
        return productId;
    }
    
    // Thêm giai đoạn mới cho sản phẩm
    function addProductStage(
        string memory _productId,
        string memory _stageName,
        string memory _description,
        string memory _location,
        uint256 _timestamp,
        string memory _handler
    ) public {
        // Kiểm tra sản phẩm tồn tại
        require(products[_productId].exists, "San pham khong ton tai");
        
        // Tạo và lưu giai đoạn mới
        Stage memory newStage = Stage({
            stageName: _stageName,
            description: _description,
            location: _location,
            timestamp: _timestamp,
            handler: _handler
        });
        
        productHistory[_productId].push(newStage);
        
        // Phát sự kiện
        bytes32 productIdHash = keccak256(abi.encodePacked(_productId));
        emit StageAdded(productIdHash, _productId, _stageName, _timestamp);
    }
    
    // Cập nhật thông tin sản phẩm
    function updateProduct(
        string memory _productId,
        string memory _name,
        string memory _origin,
        string memory _manufacturer
    ) public {
        // Kiểm tra sản phẩm tồn tại
        require(products[_productId].exists, "San pham khong ton tai");
        
        // Cập nhật thông tin
        Product storage product = products[_productId];
        product.name = _name;
        product.origin = _origin;
        product.manufacturer = _manufacturer;
    }
    
    // Chuyển quyền sở hữu sản phẩm - đã sửa biến không sử dụng
    function transferOwnership(
        string memory _productId,
        string memory _newOwnerId
    ) public {
        // Kiểm tra sản phẩm tồn tại
        require(products[_productId].exists, "San pham khong ton tai");
        
        // Cập nhật chủ sở hữu mới
        products[_productId].ownerId = _newOwnerId;
        
        // Phát sự kiện
        bytes32 productIdHash = keccak256(abi.encodePacked(_productId));
        emit OwnershipTransferred(productIdHash, _productId, _newOwnerId);
    }
    
    // Lấy thông tin sản phẩm
    function getProduct(string memory _productId) public view returns (Product memory) {
        require(products[_productId].exists, "San pham khong ton tai");
        return products[_productId];
    }
    
    // Kiểm tra sản phẩm có tồn tại không
    function productExists(string memory _productId) public view returns (bool) {
        return products[_productId].exists;
    }
    
    // Lấy số lượng sự kiện trong lịch sử sản phẩm
    function getProductHistoryCount(string memory _productId) public view returns (uint256) {
        return productHistory[_productId].length;
    }
    
    // Lấy thông tin giai đoạn theo index
    function getProductHistoryItem(string memory _productId, uint256 index) public view returns (Stage memory) {
        require(products[_productId].exists, "San pham khong ton tai");
        require(index < productHistory[_productId].length, "Index vuot qua lich su");
        return productHistory[_productId][index];
    }
    
    // Tạo ID cho sản phẩm - cải tiến với keccak256
    function generateProductId(
        string memory _name,
        string memory _manufacturer,
        uint256 _timestamp
    ) internal pure returns (string memory) {
        // Sử dụng keccak256 để tạo một ID ngắn gọn và duy nhất
        bytes32 hash = keccak256(abi.encodePacked(_name, _manufacturer, _timestamp));
        
        // Chuyển hash thành chuỗi hex có độ dài phù hợp (16 ký tự)
        bytes memory result = new bytes(16);
        for(uint i = 0; i < 8; i++) {
            result[i*2] = bytes1(uint8(uint(uint8(hash[i])) / 16 + 48 + (uint(uint8(hash[i])) / 16 > 9 ? 39 : 0)));
            result[i*2+1] = bytes1(uint8(uint(uint8(hash[i])) % 16 + 48 + (uint(uint8(hash[i])) % 16 > 9 ? 39 : 0)));
        }
        return string(result);
    }
}