const { getNamedAccounts, ethers } = require("hardhat")
const { getWeth, AMOUNT } = require("../scripts/getWeth")

async function main() {
    await getWeth()
    const { deployer } = await getNamedAccounts()
    //lending pool address provider:
    const lendingPool = await getLendingPool(deployer)
    console.log(`lendingpool address is ${lendingPool.address}`)

    //Deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
    //approve
    await approveERC20(wethTokenAddress, lendingPool.address, AMOUNT, deployer)
    console.log("Depositing....................")
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
    console.log("deposited")
    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(lendingPool, deployer)
    const daiPrice = await getDaiPrice()
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    console.log(`you can borrow ${amountDaiToBorrow} Dai`)

    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())

    const daiTokeAddress = "0x6b175474e89094c44da98b954eedeac495271d0f"
    await borrowDai(daiTokeAddress, lendingPool, amountDaiToBorrowWei, deployer)
    await getBorrowUserData(lendingPool, deployer)
    await repay(amountDaiToBorrowWei, daiTokeAddress, lendingPool, deployer)
    await getBorrowUserData(lendingPool, deployer)
    async function repay(amount, daiAddress, lendingPool, account) {
        await approveERC20(daiAddress, lendingPool.address, amount, account)
        const repayTx = await lendingPool.repay(daiAddress, amount, 1, account)
        await repayTx.wait(1)
        console.log("Repaid!")
    }

    async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
        const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 1, 0, account)
        await borrowTx.wait(1)
        console.log("you've borrowed ")
    }

    async function getDaiPrice() {
        const daiETHpriceFeed = await ethers.getContractAt(
            "AggregatorV3Interface",
            "0x773616E4d11A78F511299002da57A0a94577F1f4"
        )
        const price = (await daiETHpriceFeed.latestRoundData())[1]
        console.log(`DAI/ETH price is ${price.toString()}`)
        return price
    }

    //Borrow
    async function getBorrowUserData(lendingPool, account) {
        const {
            totalCollateralETH,
            totalDebtETH,
            availableBorrowsETH
        } = await lendingPool.getUserAccountData(account)
        console.log(`you have ${totalCollateralETH} worth of ETH Deposited`)
        console.log(`you have ${totalDebtETH} worth of ETH Borrowed`)
        console.log(`you can borrow ${availableBorrowsETH} worth oh ETH`)
        return { availableBorrowsETH, totalDebtETH }
    }
    async function getLendingPool(account) {
        const lendingPoolAddressProvider = await ethers.getContractAt(
            "ILendingPoolAddressesProvider",
            "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
            account
        )
        const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool()
        const lendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress, account)
        return lendingPool
    }
    async function approveERC20(erc20Address, spenderAddress, amountToSpend, account) {
        const erc20Token = await ethers.getContractAt("IERC20", erc20Address, account)
        const tx = await erc20Token.approve(spenderAddress, amountToSpend)
        await tx.wait(1)
        console.log("Approved.......................")
    }
}
main(() => (process.exit = 0)).catch(error => {
    console.log(error)
    process.exit(1)
})
