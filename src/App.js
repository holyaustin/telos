/* eslint-disable react/jsx-no-comment-textnodes */
import React, { useEffect, useState } from "react";
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from "ethers";
import contractAbi from './utils/contractAbi.json';
import telosLogo from './assets/TelosLogo.svg';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';


// Constants
const TWITTER_HANDLE = 'holyaustin';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TELOS_LINK = `https://www.telos.net/`;
// Add the domain you will be minting
const tld = '.tlos';
const CONTRACT_ADDRESS = '0xe078fe7A93017F8e18c1C52E79632d0B94c56c26';

const App = () => {
	// Create a stateful variable to store the network next to all the others
	const [network, setNetwork] = useState('');
	const [currentAccount, setCurrentAccount] = useState('');
	// Add some state data propertie
	const [domain, setDomain] = useState('');
  	const [record, setRecord] = useState('');
	const [editing, setEditing] = useState(false);
	const [loading, setLoading] = useState(false);
	const [mints, setMints] = useState([]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }
			
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const switchNetwork = async () => {
	if (window.ethereum) {
		try {
			// Try to switch to the Telos testnet
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: '0x29' }], // Check networks.js for hexadecimal network ids
			});
		} catch (error) {
			// This error code means that the chain we want has not been added to MetaMask
			// In this case we ask the user to add it to their MetaMask
			if (error.code === 4902) {
				try {
					await window.ethereum.request({
						method: 'wallet_addEthereumChain',
						params: [
							{	
								chainId: '0x29',
								chainName: 'Telos EVM Testnet',
								rpcUrls: ['https://testnet.telos.net/evm'],
								nativeCurrency: {
										name: "TELOS",
										symbol: "TLOS",
										decimals: 18
								},
								blockExplorerUrls: ["https://testnet.teloscan.io/"]
							},
						],
					});
				} catch (error) {
					console.log(error);
				}
			}
			console.log(error);
		}
	} else {
		// If window.ethereum is not found then MetaMask is not installed
		alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
	} 
}

	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;

		if (!ethereum) {
			console.log('Make sure you have metamask!');
			return;
		} else {
			console.log('We have the ethereum object', ethereum);
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found');
		}
		// This is the new part, we check the user's network chain ID
		const chainId = await ethereum.request({ method: 'eth_chainId' });
		console.log('My chainId is ', chainId);
		
		setNetwork(networks[chainId]);

		ethereum.on('chainChanged', handleChainChanged);
		
		
		// Reload the page when they change networks
		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	};

	const mintDomain = async () => {
		// Don't run if the domain is empty
		if (!domain) { return }
		// Alert the user if the domain is too short
		if (domain.length < 3) {
			alert('Domain must be at least 3 characters long');
			return;
		}
		// Calculate price based on length of domain (change this to match your contract)	
		// 3 chars = 0.5 TELOS, 4 chars = 0.3 TELOS 5 or more = 0.1 TELOS
		const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.1' : '0.01';
		console.log("Minting domain", domain, "with price", price);
	  try {
		const { ethereum } = window;
		if (ethereum) {
		  const provider = new ethers.providers.Web3Provider(ethereum);
		  const signer = provider.getSigner();
		  const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
	
				console.log("Going to pop wallet now to pay gas...")
		  let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)});
		  // Wait for the transaction to be mined
				const receipt = await tx.wait();
	
				// Check if the transaction was successfully completed
				if (receipt.status === 1) {
					console.log("Domain minted! https://testnet.teloscan.io/tx/"+tx.hash);
					
					// Set the record for the domain
					tx = await contract.setRecord(domain, record);
					//await tx.wait();
	
					console.log("Record set! https://testnet.teloscan.io/tx/"+tx.hash);
				
					
				// Call fetchMints after 1 seconds
				setTimeout(() => {
					fetchMints();
				}, 1000);
					
					setRecord('');
					setDomain('');
					alert("Aha! Your TELOS Name was created successfully.");
				}
				else {
					alert("Transaction failed! Please try again");
				}
		}
	  }
	  catch(error){
		console.log(error);
	  }
	}

	// Add this function anywhere in your component (maybe after the mint function)
const fetchMints = async () => {
	try {
		const { ethereum } = window;
		if (ethereum) {
			// You know all this
			const provider = new ethers.providers.Web3Provider(ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
				
			// Get all the domain names from our contract
			const names = await contract.getAllNames();
				
			// For each name, get the record and the address
			const mintRecords = await Promise.all(names.map(async (name) => {
			const mintRecord = await contract.records(name);
			const owner = await contract.domains(name);
			return {
				id: names.indexOf(name),
				name: name,
				record: mintRecord,
				owner: owner,
			};
		}));

		console.log("MINTS FETCHED ", mintRecords);
		setMints(mintRecords);
		}
	} catch(error){
		console.log(error);
	}
}

// This will run any time currentAccount or network are changed
useEffect(() => {
	if (network === 'Telos EVM Testnet') {
		fetchMints();
	}
}, [currentAccount, network]);

	const updateDomain = async () => {
		if (!record || !domain) { return }
		setLoading(true);
		console.log("Updating domain", domain, "with record", record);
		  try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
	
				let tx = await contract.setRecord(domain, record);
				await tx.wait();
				console.log("Record set https://testnet.teloscan.io/tx/"+tx.hash);
	
				fetchMints();
				setRecord('');
				setDomain('');
			}
		  } catch(error) {
			console.log(error);
		  }
		setLoading(false);
	}

	// Render methods
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
			<img src="https://miro.medium.com/max/1400/1*yAYscXSHm1f8trduUDclPA.gif" alt="Web3 gif" />
      {/* Call the connectWallet function we just wrote when the button is clicked */}
			<button onClick={connectWallet} className="cta-button connect-wallet-button">
				Connect Wallet
			</button>
		</div>
	);

	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
			return (
				<div className="mint-container">
					<p className="subtitle"> Recently minted domains!</p>
					<div className="mint-list">
						{ mints.map((mint, index) => {
							return (
								<div className="mint-item" key={index}>
									<div className='mint-row'>
										<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
											<p className="underlined">{' '}{mint.name}{tld}{' '}</p>
										</a>
										{/* If mint.owner is currentAccount, add an "edit" button*/}
										{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
											<button className="edit-button" onClick={() => editRecord(mint.name)}>
												<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
											</button>
											:
											null
										}
									</div>
						<p> {mint.record} </p>
					</div>)
					})}
				</div>
			</div>);
		}
	};
	
	// This will take us into edit mode and show us the edit buttons!
	const editRecord = (name) => {
		console.log("Editing record for", name);
		setEditing(true);
		setDomain(name);
	}


	
	// Form to enter domain name and data
	const renderInputForm = () =>{
	// If not on Polygon Mumbai Testnet, render the switch button
	if (network !== 'Telos EVM Testnet') {
		return (
			<div className="connect-wallet-container">
				<h2>Please switch to Telos Testnet</h2>
				{/* This button will call our switch network function */}
				<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
			</div>
		);
	}
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder='Enter Record (wallet addresses, secret encrypted messages, Spotify links, IP address, whatever you want!)'
					onChange={e => setRecord(e.target.value)}
				/>

					{/* If the editing variable is true, return the "Set record" and "Cancel" button */}
					{editing ? (
						<div className="button-container">
							
							<button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
								Set record
							</button>  
							
							<button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
								Cancel
							</button>  
						</div>
					) : (
						// If editing is not true, the mint button will be returned instead
						<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
							Mint
						</button>  
					)}

			</div>
		);
	}
  
	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	return (
		<div className="App">
			<div className="container">
				<div className="header-container">
					<header>
						<div className="left">
							<p className="title"> <img alt="Telos Logo" src={telosLogo} width="150"/> Telos Name Service</p>
							<p className="subtitle">Your immortal Telos Name API on the blockchain!</p>
						</div>
						{/* Display a logo and wallet connection status*/}
						<div className="right">
							<img alt="Network logo" className="logo" src={ network.includes("Telos") ? telosLogo : ethLogo}  />
							{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
						</div>
					</header>
				</div>
				
				{!currentAccount && renderNotConnectedContainer()}
				{/* Render the input form if an account is connected */}
				{currentAccount && renderInputForm()}
				{mints && renderMints()}
				
				<div className="footer-container">
				<img alt="Telos Logo" className="twitter-logo" src={telosLogo} />
					<a
						className="footer-text"
						href={TELOS_LINK}
						target="_blank"
						rel="noreferrer"
					>{`Proudly deployed on Telos EVM Testnet`}</a>
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built by @${TWITTER_HANDLE}`}</a>


				</div>
			</div>
		</div>
	);
};

export default App;