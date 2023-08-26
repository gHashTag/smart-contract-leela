const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('LeelaToken', function () {
  let LeelaToken
  let leelaToken
  let owner
  let addr1
  let addr2

  beforeEach(async function () {
    // Deploy the LeelaToken contract
    LeelaToken = await ethers.getContractFactory('LeelaToken')
    ;[owner, addr1, addr2] = await ethers.getSigners()
    leelaToken = await LeelaToken.deploy()
  })

  it('Must have the correct name, symbol, and total number of tokens', async function () {
    expect(await leelaToken.name()).to.equal('Leela Token')
    expect(await leelaToken.symbol()).to.equal('LEELA')
    expect(await leelaToken.totalSupply()).to.equal(ethers.parseEther('72000'))
  })

  it("The contract creator's balance must be equal to the total number of tokens", async function () {
    const totalSupply = await leelaToken.totalSupply()
    const ownerBalance = await leelaToken.balanceOf(owner.address)
    expect(totalSupply).to.equal(ownerBalance)
  })

  it('Should allow transfer of tokens between accounts', async function () {
    // Get the owner's balance before the transaction
    const initialBalanceOwner = await leelaToken.balanceOf(owner.address)
    // Get account balance addr1 before transaction
    const initialBalanceAddr1 = await leelaToken.balanceOf(addr1.address)

    // Determine the amount to transfer
    const transferAmount = ethers.parseEther('100')
    console.log('transferAmount', transferAmount)
    // Transfer tokens from contract owner to addr1
    await leelaToken.transfer(addr1.address, transferAmount)

    // Get owner's balance after transaction
    const finalBalanceOwner = await leelaToken.balanceOf(owner.address)
    // Get the balance of addr1 after the transaction
    const finalBalanceAddr1 = await leelaToken.balanceOf(addr1.address)
    console.log('finalBalanceOwner', finalBalanceOwner)
    console.log('finalBalanceAddr1', finalBalanceAddr1)
    // Check for balance changes after transfer
    expect(finalBalanceOwner).to.equal(initialBalanceOwner - transferAmount)
    expect(finalBalanceAddr1).to.equal(initialBalanceAddr1 + transferAmount)
  })

  it('Should allow setting permission to transfer tokens', async function () {
    const approvalAmount = ethers.parseEther('500')

    await leelaToken.approve(addr1.address, approvalAmount)

    const allowance = await leelaToken.allowance(owner.address, addr1.address)
    expect(allowance).to.equal(approvalAmount)
  })

  it('Should allow passing tokens via permission', async function () {
    const initialBalanceOwner = await leelaToken.balanceOf(owner.address)
    const transferAmount = ethers.parseEther('500')

    await leelaToken.approve(addr1.address, transferAmount)
    await leelaToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)

    const balanceOwnerAfterTransfer = await leelaToken.balanceOf(owner.address)
    const balanceAddr2 = await leelaToken.balanceOf(addr2.address)

    expect(balanceOwnerAfterTransfer).to.equal(initialBalanceOwner - transferAmount)
    expect(balanceAddr2).to.equal(transferAmount)
  })
})
