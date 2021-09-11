import React, { useState } from "react";
import { ethers } from "ethers";
import { v1Abi } from '../common/abi';
import config from '../config'
import { useProvider } from "../common/provider";

export default function Mint() {
    const [text, setText] = useState('')
    const [textType, setTextType] = useState('text/plain')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [provider, setProvider] = useProvider()

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
        const contractWithSigner = contract.connect(provider.getSigner())
  
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

    return (
        <div>
            <div className="columns m-4">
              <div className="column is-half">
                <h1 className="title">Mint your NFT</h1>
                <div className="field">
                  <label className="label">Title</label>
                  <div className="control">
                    <input className="input" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title of your artwork"/>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Description</label>
                  <div className="control">
                    <input className="input" type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description of your artwork"/>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Content</label>
                  <select value={textType} onChange={(event) => setTextType(event.target.value)}>
                    <option value='text/plain'>Plain Text</option>
                    <option value='text/markdown'>Markdown</option>
                  </select>
                  <div className="control">
                    <textarea className="textarea" value={text} onChange={(event) => setText(event.target.value)} placeholder="Content of your artwork"></textarea>
                  </div>
                </div>

                {provider ? <button className="button is-primary" onClick={executeTransaction}>Mint</button> : <></>}
              </div>
            </div>
        </div>
    )
}