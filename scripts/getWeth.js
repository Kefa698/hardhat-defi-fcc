const { getNamedAccounts, ethers } = require("hardhat")
const AMOUNT = ethers.utils.parseEther("0.2")
async function getWeth() {
    const { deployer } = await getNamedAccounts()

    ///call deposit function on WETH contract
    //we always need abi,contract address
    const iweth = await ethers.getContractAt(
        "IWeth",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        deployer
    )
    const tx = await iweth.deposit({ value: AMOUNT })
    await tx.wait(1)
    const wethbalance = await iweth.balanceOf(deployer)
    console.log(`Got ${wethbalance.toString()}WETH`);
}
module.exports = { getWeth,AMOUNT }
