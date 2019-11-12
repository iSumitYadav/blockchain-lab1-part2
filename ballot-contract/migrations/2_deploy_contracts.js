var change_org = artifacts.require("Change_Org");

module.exports = function (deployer) {
	deployer.deploy(change_org, 5);
};