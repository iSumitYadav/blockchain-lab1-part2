var Ballot = artifacts.require("Change_Org");

module.exports = function (deployer) {
	deployer.deploy(Ballot, 1);
};