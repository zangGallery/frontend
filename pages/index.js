import Head from 'next/head'
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { v1Abi } from '../common/abi';
import { BigNumber } from '@ethersproject/bignumber';
import config from '../config'

import "bulma/css/bulma.min.css";

export default function Home() {
    const [provider, setProvider] = useState(null)
    const [loggedUser, setLoggedUser] = useState(null)
    const [text, setText] = useState('')
    const [textType, setTextType] = useState('text/plain')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const [requestedTokenId, setRequestedTokenId] = useState('1')
    const [requestedTokenURI, setRequestedTokenURI] = useState(null)
    const [requestedTokenContent, setRequestedTokenContent] = useState('')

    const getSigner = () => provider?.getSigner()

    useEffect(() => {
      if (requestedTokenURI) {
        fetch(requestedTokenURI)
          .then((response) => response.text())
          .then((parsedText) => setRequestedTokenContent(parsedText))
      }
    }, [requestedTokenURI])

    const connectWallet = async () => {
        const providerOptions = {
          /* See Provider Options Section */
          walletconnect: {
            package: WalletConnectProvider, // required
            options: {
              infuraId: "INFURA_ID" // required //TODO: Get true infura id
            }
          }
      };
        
      const web3Modal = new Web3Modal({
        network: "mainnet", // optional
        cacheProvider: false, // optional
        providerOptions, // required
        disableInjectedProvider: false
      });
      web3Modal.clearCachedProvider();
        
      const walletProvider = await web3Modal.connect();
      const newProvider = new ethers.providers.Web3Provider(walletProvider);

      setProvider(newProvider);
      const userAddress = await newProvider.getSigner().getAddress();
      console.log(userAddress);
      setLoggedUser(userAddress);
    }

    const useUTF8 = () => {
      return [...text].some(char => char.charCodeAt(0) > 127)
    }

    const getUri = () => {
      return 'data:'
       + textType
       + (useUTF8() ? ';charset=UTF-8' : '')
       + ',' + encodeURI(text)
    }

    const executeTransaction = async () => {
      const contractAddress = config.contractAddresses.v1;
      
      const contract = new ethers.Contract(contractAddress, v1Abi, provider);
      const contractWithSigner = contract.connect(getSigner())

      const transaction = await contractWithSigner.mint(getUri(), title, description)
      const receipt = await transaction.wait(1)
      if (receipt && receipt.blockNumber) {
        const matchingEvents = receipt.events.filter(event => event.event == 'Transfer' && event.args.from == 0)
        if (matchingEvents.length == 1) {
          const tokenId = matchingEvents[0].args[2]
          console.log(await contractWithSigner.tokenURI(tokenId))
        }
        else {
          console.log('Error')
        }
      }
    }

    const getTokenURI = async () => {
      const contractAddress = config.contractAddresses.v1;
      
      const contract = new ethers.Contract(contractAddress, v1Abi, provider);
      const tURI = await contract.tokenURI(requestedTokenId);

      setRequestedTokenURI(tURI);
    }

    return (
        <div>
          <Head>
            <title>zang</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <nav class="navbar" role="navigation" aria-label="main navigation">
            <div class="navbar-brand">
              <a class="navbar-item" href=".">
                <h1 class="title">{".zang{"}</h1>
              </a>

              <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
              </a>
            </div>

            <div id="navbarBasicExample" class="navbar-menu">
              <div class="navbar-start">
                <a class="navbar-item">
                  Home
                </a>

                <a class="navbar-item">
                  Mint
                </a>
              </div>
              
              
              <div class="navbar-end">
                <div class="navbar-item">
                  <div class="buttons">
                      <a class="button is-link" onClick={connectWallet}>Connect Wallet</a>
                  </div>
                </div>
              </div>
              
            </div>

          </nav>

            {loggedUser ? <h4 class="title is-4 has-text-centered">Welcome {loggedUser}!</h4> : <h4 class="title is-4 has-text-centered">Not Connected</h4>}
            <div class="columns m-4">
              <div class="column is-half">
                <h1 class="title">Mint your NFT</h1>
                <div class="field">
                  <label class="label">Title</label>
                  <div class="control">
                    <input class="input" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title of your artwork"/>
                  </div>
                </div>
                <div class="field">
                  <label class="label">Description</label>
                  <div class="control">
                    <input class="input" type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description of your artwork"/>
                  </div>
                </div>
                <div class="field">
                  <label class="label">Content</label>
                  <select value={textType} onChange={(event) => setTextType(event.target.value)}>
                    <option value='text/plain'>Plain Text</option>
                    <option value='text/markdown'>Markdown</option>
                  </select>
                  <div class="control">
                    <textarea class="textarea" value={text} onChange={(event) => setText(event.target.value)} placeholder="Content of your artwork"></textarea>
                  </div>
                </div>
                
                {provider ? <button class="button is-primary" onClick={executeTransaction}>Mint</button> : <></>}

                <p>{getUri()}</p>

                <hr/>
                <h1 class="title">Search a NFT</h1>

                <p>Token URI:</p>
                <input type='text' value={requestedTokenId} onChange={(event) => setRequestedTokenId(event.target.value)} />
                <button onClick={getTokenURI}>Query</button>
                <p>{requestedTokenContent}</p>
              </div>
            </div>
        </div>
    )
}