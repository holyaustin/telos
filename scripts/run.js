const main = async () => {
  const [owner, superCoder] = await hre.ethers.getSigners();
  const domainContractFactory = await hre.ethers.getContractFactory('Domains');
  // We pass in "ninja" to the constructor when deploying
  const domainContract = await domainContractFactory.deploy("web3");
  await domainContract.deployed();

  console.log("Contract deployed to:", domainContract.address);
  console.log("Contract owner:", owner.address);

  // We're passing in a second variable - value. This is the moneyyyyyyyyyy
  let txn = await domainContract.register("holyaustin",  {value: hre.ethers.utils.parseEther('2222')});
  await txn.wait();

   // How much money is in here?
   const balance = await hre.ethers.provider.getBalance(domainContract.address);
   console.log("Contract balance:", hre.ethers.utils.formatEther(balance));
 
   // Quick! Grab the funds from the contract! (as superCoder)
   try {
     txn = await domainContract.connect(superCoder).withdraw();
     await txn.wait();
   } catch(error){
     console.log("Could not rob contract");
   }
 
   // Let's look in their wallet so we can compare later
   let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
   console.log("Balance of owner before withdrawal:", hre.ethers.utils.formatEther(ownerBalance));
 
   // Oops, looks like the owner is saving their money!
   txn = await domainContract.connect(owner).withdraw();
   await txn.wait();



  const address = await domainContract.getAddress("holyaustin");
  console.log("Owner of domain holyaustin:", address);

    // Fetch balance of contract & owner
    const contractBalance = await hre.ethers.provider.getBalance(domainContract.address);
    ownerBalance = await hre.ethers.provider.getBalance(owner.address);
  console.log("Contract balance:", hre.ethers.utils.formatEther(contractBalance) + " MATIC");
  console.log("Balance of owner after withdrawal:", hre.ethers.utils.formatEther(ownerBalance) + " MATIC");
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();