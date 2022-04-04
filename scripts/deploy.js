const main = async () => {
    const domainContractFactory = await hre.ethers.getContractFactory('Domains');
    const domainContract = await domainContractFactory.deploy("web3");
    await domainContract.deployed();
  
    console.log("Contract deployed to:", domainContract.address);
  
    // CHANGE THIS DOMAIN TO SOMETHING ELSE! I don't want to see OpenSea full of bananas lol
      let txn = await domainContract.register("paul",  {value: hre.ethers.utils.parseEther('0.03')});
      await txn.wait();
    console.log("Minted domain paul.web3");
  
    txn = await domainContract.setRecord("paul", "Am I a onboarded to web3??");
    await txn.wait();
    console.log("Set record for paul.web3");
  
    const address = await domainContract.getAddress("paul");
    console.log("Owner of domain paul:", address);
  
    const balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log("Contract balance:", hre.ethers.utils.formatEther(balance));
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