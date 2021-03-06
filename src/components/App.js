import React, { useEffect, useState } from 'react'
import Web3 from 'web3'
import DaiToken from '../abis/DaiToken.json'
import DappToken from '../abis/DappToken.json'
import TokenFarm from '../abis/TokenFarm.json'
import './App.css'
import Main from './Main'
import Navbar from './Navbar'

const TokenFarmApp = () => {
	const [account, setAccount] = useState('0x0')
	const [daiToken, setDaiToken] = useState({})
	const [dappToken, setDappToken] = useState({})
	const [tokenFarm, setTokenFarm] = useState({})
	const [daiTokenBalance, setDaiTokenBalance] = useState('0')
	const [dappTokenBalance, setDappTokenBalance] = useState('0')
	const [stakingBalance, setStakingBalance] = useState('0')
	const [loading, setLoading] = useState(true)

	const loadWebThree = async () => {
		if (window.ethereum) {
			window.web3 = new Web3(window.ethereum)
			await window.ethereum.request({ method: 'eth_requestAccounts' })
		} else if (window.web3) {
			window.web3 = new Web3(window.web3.currentProvider)
		} else {
			window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
		}
	}

	const loadBlockchainData = async () => {
		const web3 = window.web3
		const networkId = await web3.eth.net.getId()

		// Set account
		const [connectedAccount] = await web3.eth.getAccounts()
		setAccount(connectedAccount)

		// Load contract - DaiToken
		const daiTokenData = DaiToken.networks[networkId]
		if (daiTokenData) {
			const token = await new web3.eth.Contract(DaiToken.abi, daiTokenData.address)
			const balance = await token.methods.balanceOf(connectedAccount).call()
			setDaiToken(token)
			setDaiTokenBalance(balance.toString())
		} else {
			window.alert('DaiToken contract not deployed to detected network.')
		}

		// Load contract - DappToken
		const dappTokenData = DappToken.networks[networkId]
		if (dappTokenData) {
			const token = await new web3.eth.Contract(DappToken.abi, dappTokenData.address)
			const balance = await token.methods.balanceOf(connectedAccount).call()
			setDappToken(token)
			setDappTokenBalance(balance.toString())
		} else {
			window.alert('DappToken contract not deployed to detected network.')
		}

		// Load contract - TokenFarm
		const tokenFarmData = TokenFarm.networks[networkId]
		if (tokenFarmData) {
			const token = await new web3.eth.Contract(TokenFarm.abi, tokenFarmData.address)
			const balance = await token.methods.stakingBalance(connectedAccount).call()
			setTokenFarm(token)
			setStakingBalance(balance.toString())
		} else {
			window.alert('TokenFarm contract not deployed to detected network.')
		}

		// Loaded
		setLoading(false)
	}

	useEffect(() => {
		loadWebThree()
		loadBlockchainData()
	}, [])

	const stakeTokens = amount => {
		setLoading(true)
		daiToken.methods
			.approve(tokenFarm._address, amount)
			.send({ from: account })
			.on('transactionHash', hash => {
				tokenFarm.methods
					.stakeTokens(amount)
					.send({ from: account })
					.on('transactionHash', hash => {
						setLoading(false)
					})
			})
	}

	// TODO: implement unstakeTokens(amount)

	const unstakeAllTokens = () => {
		setLoading(true)
		tokenFarm.methods
			.unstakeAllTokens()
			.send({ from: account })
			.on('transactionHash', hash => {
				setLoading(false)
			})
	}

	// TODO: add a button and logic that will issue tokens (admin tool)

	const renderContent = () => {
		let content
		if (loading) {
			content = (
				<p id="loader" className="text-center mt-5">
					Loading...
				</p>
			)
		} else {
			content = (
				<Main
					daiTokenBalance={daiTokenBalance}
					dappTokenBalance={dappTokenBalance}
					stakingBalance={stakingBalance}
					stakeTokens={stakeTokens}
					unstakeAllTokens={unstakeAllTokens}
				/>
			)
		}
		return content
	}

	return (
		<div>
			<Navbar account={account} />
			<div className="container-fluid mt-5">
				<div className="row">
					<main role="main" className="col-lg-12 ml-auto mr-auto" style={{ maxWidth: '600px' }}>
						<div className="content mr-auto ml-auto">{renderContent()}</div>
					</main>
				</div>
			</div>
			<footer className="text-center">
				<a href="https://drewcook.dev" target="_blank" rel="noopener noreferrer">
					<small>Built by Drew Cook</small>
				</a>
			</footer>
		</div>
	)
}

export default TokenFarmApp
