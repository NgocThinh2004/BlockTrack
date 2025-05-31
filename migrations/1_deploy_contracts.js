const ProductTracker = artifacts.require("ProductTracker");

module.exports = function(deployer) {
  deployer.deploy(ProductTracker);
};