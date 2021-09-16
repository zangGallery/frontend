import React, { useState } from "react";
import { ethers } from "ethers";
import { v1Abi } from '../common/abi';
import config from '../config'
import { useWalletProvider } from "../common/provider";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Decimal from "decimal.js";
import { useForm, Controller } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi"
import { schemas } from "../common";
import MintConfirmModal from "../components/MintConfirmModal";

const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

const defaultValues = {
  editionSize: 1,
  royaltyPercentage: 10,
  useCustomRecipient: false,
  textType: 'text/plain'
}

export default function Mint() {
  const router = useRouter();
  const { register, formState: { errors }, control, handleSubmit, watch } = useForm({ defaultValues: defaultValues, mode: 'onChange', resolver: joiResolver(schemas.mint)});
  const [text, setText] = useState('')
  const [textType, setTextType] = useState('text/plain')
  const [walletProvider, setWalletProvider] = useWalletProvider()
  const [transactionState, setTransactionState] = useState({ status: 'noTransaction'})
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const watchUseCustomRecipient = watch('useCustomRecipient', defaultValues.useCustomRecipient);
  const watchTextType = watch('textType', defaultValues.textType)

  const numConfirmations = 5;

  const executeTransaction = (mintConfirmed)  => async (data) => {
    // Add non-React Hook Form fields
    data = {...data, text};

    if (!(data.title && data.description && data.text) && !mintConfirmed) {
      // Open the confirm modal (if it's not already open)
      if (!confirmModalOpen) {
        setConfirmModalOpen(true);
      }
      return;
    }

    const useUTF8 = () => {
      return [...data.text].some(char => char.charCodeAt(0) > 127)
    }

    const uri = 'data:'
                + data.textType
                + (useUTF8() ? ';charset=UTF-8' : '')
                + ',' + encodeURI(data.text)

    setTransactionState({ status: 'getSigner' });
    const contractAddress = config.contractAddresses.v1;

    const contract = new ethers.Contract(contractAddress, v1Abi, walletProvider);
    const contractWithSigner = contract.connect(walletProvider.getSigner())

    const effectiveRoyaltyPercentage = new Decimal(data.royaltyPercentage).mul('100').toNumber();
    const effectiveRoyaltyRecipient = data.useCustomRecipient ? data.customRecipient : (await walletProvider.getSigner().getAddress());

    try {
      setTransactionState({ status: 'signing'})
      const transaction = await contractWithSigner.mint(uri, data.title, data.description, data.editionSize, effectiveRoyaltyPercentage, effectiveRoyaltyRecipient, 0);

      let receipt = null;

      for (let i = 0; i < numConfirmations; i++) {
        setTransactionState({ status: 'confirmations', total: numConfirmations, done: i})
        receipt = await transaction.wait(1)
      }

      if (receipt && receipt.blockNumber) {
        const matchingEvents = receipt.events.filter(event => event.event == 'TransferSingle' && event.args.from == 0)
        if (matchingEvents.length == 1) {
          const tokenId = matchingEvents[0].args[3]
          router.push('/nft/' + tokenId);
        }
        else {
          throw new Error('Wrong number of events emitted.')
        }
      }
    }
    catch (e) {
      setTransactionState({ status: 'error', error: e})
    }
  }

  const getTransactionStatusInfo = () => {
    let message = null;
    switch(transactionState.status) {
      case 'getSigner' : {
        message = 'Querying signer...';
        break;
      }
      case 'signing' : {
        message = 'Waiting for signature';
        break;
      }
      case 'confirmations' : {
        message = `Awaiting confirmations... (${transactionState.done}/${transactionState.total})`;
        break;
      }
      case 'error': {
        message = 'Error: ' + transactionState.error.message;
        if (transactionState.error.data?.message) {
          message += transactionState.error.data.message;
        }
        break;
      }
    }

    if (message) {
      return <p>{message}</p>
    }
    else {
      return <></>
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
              <input className="input" type="text" {...register('title')} placeholder="Title of your artwork" />
            </div>
          </div>
          <div className="field">
            <label className="label">Description</label>
            <div className="control">
              <input className="input" type="text" {...register('description')} placeholder="Description of your artwork" />
            </div>
          </div>
          <div className="field">
            <label className="label">Edition size</label>
            <div className="control">
              <input className="input" type="number" {...register('editionSize')} defaultValue="1" min="1" />
            </div>
          </div>
          <div className="field">
            <label className="label">Content</label>
            <select {...register('textType')}>
              <option value='text/plain'>Plain Text</option>
              <option value='text/markdown'>Markdown</option>
            </select>
            <div className="control">
              { watchTextType == 'text/plain' ? 
              <textarea className="textarea" value={text} onChange={(event) => setText(event.target.value)} placeholder="Content of your artwork"></textarea>
              : <></>
              }
              <div style={{display : watchTextType == 'text/markdown' ? 'block' : 'none'}}>
                <MDEditor value={text} onChange={setText}/>
              </div>
            </div>
          </div>
          <div className="field">
            <label className="label">Royalty percentage</label>
            <div className="control">
              <input className="input" type="number" {...register('royaltyPercentage', { required: true, min: "1", max: "100" })} defaultValue="10" min="1" max="100" step="0.01" />
            </div>
            {errors.royaltyPercentage?.message || <></>}
          </div>
          <div className="field">
          <label className="label">
            <input className="checkbox" type="checkbox" {...register('useCustomRecipient')} />
            Custom royalty recipient
            </label>
            
          </div>
          {
            watchUseCustomRecipient ? (
              <div className="field">
                <label className="label">Address</label>
                <input className="input" type="text" {...register('customRecipient')} placeholder='0x... or ENS address' />
                {errors.customRecipient?.message || <></>}
              </div>
            ) : <></>
          }
          {
            walletProvider ? (
              transactionState.status == 'noTransaction' || transactionState.status == 'error' ?
                <button className="button is-primary" onClick={handleSubmit(executeTransaction(false))}>Mint</button> : <></>
            )
            : <p>Connect a wallet to mint</p>
          }
          {getTransactionStatusInfo()}
        </div>
      </div>
      <MintConfirmModal isOpen={confirmModalOpen} setIsOpen={setConfirmModalOpen} onClose={(confirmed) => handleSubmit(executeTransaction(confirmed))()} />
    </div>
  )
}