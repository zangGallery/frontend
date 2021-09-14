import React, { useState } from "react";
import { ethers } from "ethers";
import { v1Abi } from '../common/abi';
import config from '../config'
import { useWalletProvider } from "../common/provider";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

export default function Mint() {
  const [text, setText] = useState('')
  const [textType, setTextType] = useState('text/plain')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editionSize, setEditionSize] = useState(1)
  const [royaltyPercentage, setRoyaltyPercentage] = useState(10)
  const [walletProvider, setWalletProvider] = useWalletProvider()
  const [useCustomRecipient, setUseCustomRecipient] = useState(false)
  const [customRecipient, setCustomRecipient] = useState('')

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

    const contract = new ethers.Contract(contractAddress, v1Abi, walletProvider);
    const contractWithSigner = contract.connect(walletProvider.getSigner())

    const effectiveRoyaltyRecipient = useCustomRecipient ? customRecipient : (await walletProvider.getSigner().getAddress());

    const transaction = await contractWithSigner.mint(getUri(), title, description, editionSize, royaltyPercentage, effectiveRoyaltyRecipient, 0);
    const receipt = await transaction.wait(1)
    if (receipt && receipt.blockNumber) {
      const matchingEvents = receipt.events.filter(event => event.event == 'TransferSingle' && event.args.from == 0)
      if (matchingEvents.length == 1) {
        const tokenId = matchingEvents[0].args[3]
        console.log(await contractWithSigner.uri(tokenId))
      }
      else {
        console.log('Error')
      }
    }
  }

  return (
    <div>
      <div className="columns m-4">
        <div className="column is-half">
          <h1 className="title">Mint your NFT</h1>
          <div className="field">
            <label className="label">Title</label>
            <div className="control">
              <input className="input" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title of your artwork" />
            </div>
          </div>
          <div className="field">
            <label className="label">Description</label>
            <div className="control">
              <input className="input" type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description of your artwork" />
            </div>
          </div>
          <div className="field">
            <label className="label">Edition size</label>
            <div className="control">
              <input className="input" type="number" value={editionSize} onChange={(event) => setEditionSize(event.target.value)} min="1" />
            </div>
          </div>
          <div className="field">
            <label className="label">Content</label>
            <select value={textType} onChange={(event) => setTextType(event.target.value)}>
              <option value='text/plain'>Plain Text</option>
              <option value='text/markdown'>Markdown</option>
            </select>
            <div className="control">
              { textType == 'text/markdown' ? 
              <MDEditor value={text} onChange={setText}/> :
              <textarea className="textarea" value={text} onChange={(event) => setText(event.target.value)} placeholder="Content of your artwork"></textarea>
            }
            </div>
          </div>
          <div className="field">
            <label className="label">Royalty percentage</label>
            <div className="control">
              <input className="input" type="number" value={royaltyPercentage} onChange={(event) => setRoyaltyPercentage(event.target.value)} min="1" max="100" />
            </div>
          </div>
          <div className="field">
          <label className="label">
            <input className="checkbox" type="checkbox" value={useCustomRecipient} onChange={(event) => setUseCustomRecipient(event.target.checked)} />
            Custom royalty recipient
            </label>
            
          </div>
          {
            useCustomRecipient ? (
              <div className="field">
                <label className="label">Address</label>
                <input className="input" type="text" value={customRecipient} onChange={(event) => setCustomRecipient(event.target.value)} />
              </div>
            ) : <></>
          }

          {walletProvider ? <button className="button is-primary" onClick={executeTransaction}>Mint</button> : <p>Connect a wallet to mint</p>}
        </div>
      </div>
    </div>
  )
}