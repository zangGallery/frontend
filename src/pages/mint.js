import React, { useState } from "react";
import { ethers } from "ethers";
import { v1 } from '../common/abi';
import config from '../config'
import { mainnetProvider, useReadProvider, useWalletProvider } from "../common/provider";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import Decimal from "decimal.js";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi"
import { schemas } from "../common";
import { MintConfirmModal, MultiEditor } from "../components";
import { Header } from "../components";
import { navigate } from "gatsby-link";
import { Helmet } from "react-helmet";

import "bulma/css/bulma.min.css";
import '../styles/globals.css'
import { useTransactionHelper } from "../common/transaction_status";
import { useRecoilState } from 'recoil';
import { standardErrorState } from '../common/error';
import StandardErrorDisplay from "../components/StandardErrorDisplay";

const defaultValues = {
  editionSize: 1,
  royaltyPercentage: 10,
  useCustomRecipient: false,
  textType: 'text/plain'
}

export default function Mint() {
  const { register, formState: { errors }, handleSubmit, watch } = useForm({ defaultValues: defaultValues, mode: 'onChange', resolver: joiResolver(schemas.mint)});
  const [text, setText] = useState('')
  const [walletProvider, setWalletProvider] = useWalletProvider()
  const [transactionState, setTransactionState] = useState({ status: 'noTransaction'})
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const watchUseCustomRecipient = watch('useCustomRecipient', defaultValues.useCustomRecipient);
  const watchTextType = watch('textType', defaultValues.textType)
  const handleTransaction = useTransactionHelper()
  const [standardError, setStandardError] = useRecoilState(standardErrorState)

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

    const isUTF8 = () => {
      return [...data.text].some(char => char.charCodeAt(0) > 127)
    }

    setStandardError(null);

    const uri = 'data:'
                + data.textType
                + (isUTF8() && data.textType == 'text/plain' ? ',charset=UTF-8' : '')
                + ',' + encodeURIComponent(data.text)

    const contractAddress = config.contractAddresses.v1.zang;

    const contract = new ethers.Contract(contractAddress, v1.zang, walletProvider);
    const contractWithSigner = contract.connect(walletProvider.getSigner())

    const effectiveRoyaltyPercentage = new Decimal(data.royaltyPercentage).mul('100').toNumber();

    let effectiveRoyaltyRecipient = null;

    if (data.useCustomRecipient) {
      effectiveRoyaltyRecipient = data.customRecipient;

      if (effectiveRoyaltyRecipient.includes('.eth')) {
        let resolvedAddress = null;
        try {
          resolvedAddress = await mainnetProvider.resolveName(effectiveRoyaltyRecipient);
        } catch (e) {
          setStandardError('Invalid custom recipient address: "' + e.message + '".');
          return;
        }

        if (resolvedAddress) {
          effectiveRoyaltyRecipient = resolvedAddress;
        }
        else {
          setStandardError('Could not resolve ENS name.');
          return;
        }
      }
    }
    else {
      try {
        effectiveRoyaltyRecipient = await walletProvider.getSigner().getAddress();
      }
      catch (e) {
        setStandardError('Could not retrieve wallet address: "' + e.message + '".')
        return;
      }
    }

    const transactionFunction = async () => 
      await contractWithSigner.mint(uri, data.title, data.description, data.editionSize, effectiveRoyaltyPercentage, effectiveRoyaltyRecipient, 0);

    const { success, receipt } = await handleTransaction(transactionFunction, `Mint`);
    if (success && receipt && receipt.blockNumber) {
      const matchingEvents = receipt.events.filter(event => event.event == 'TransferSingle' && event.args.from == 0)
      if (matchingEvents.length == 1) {
        const tokenId = matchingEvents[0].args[3]
        navigate('/nft?id=' + tokenId);
      }
      else {
        setStandardError('Could not find token ID in transaction receipt.');
        return;
      }
    }
  }

  return (
    <div>
      <Helmet>
        <title>Mint - zang</title>
      </Helmet>
      <Header />
      <StandardErrorDisplay />
      <div className="columns m-4">
        <div className="column">
          <h1 className="title">Mint your NFT</h1>
          <div className="field">
            <label className="label" htmlFor="title">Title</label>
            <div className="control">
              <input id="title" className="input" type="text" {...register('title')} placeholder="Title of your artwork" />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="description">Description</label>
            <div className="control">
              <input id="description" className="input" type="text" {...register('description')} placeholder="Description of your artwork" />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="editionSize">Edition size</label>
            <div className="control">
              <input id="editionSize" className="input" type="number" {...register('editionSize')} defaultValue="1" min="1" />
            </div>
          </div>
          <div className="field">
            <label className="label">Content</label>
            <div className="control">
              <div className="select">
                <select {...register('textType')}>
                  <option value='text/plain'>Plain Text</option>
                  <option value='text/markdown'>Markdown</option>
                </select>
              </div>
            </div>
            <div className="control mt-3">
              <MultiEditor textType={watchTextType} value={text} setValue={setText} />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="royaltyPercentage">Royalty percentage</label>
            <div className="control">
              <input id="royaltyPercentage" className="input" type="number" {...register('royaltyPercentage')} defaultValue="10" min="0" max="100" step="0.01" />
            </div>
            {errors.royaltyPercentage?.message || <></>}
          </div>
          <div className="field">
          <label className="checkbox label">
            <input type="checkbox" {...register('useCustomRecipient')} className="mr-1" />
              Custom royalty recipient
            </label>
            
          </div>
          {
            watchUseCustomRecipient ? (
              <div className="field">
                <label className="label" htmlFor="customRecipient">Address</label>
                <input id="customRecipient" className="input" type="text" {...register('customRecipient')} placeholder='0x... or ENS address' />
                {errors.customRecipient?.message || <></>}
              </div>
            ) : <></>
          }
          <div className="notification is-danger">
            <p><strong>Important</strong>: beta.zang.gallery currently uses <strong>Ropsten</strong>. Make sure that you're signing a transaction on the Ropsten network!</p>
          </div>
          {
            walletProvider ? (
              transactionState.status == 'noTransaction' || transactionState.status == 'error' ?
                <button className="button is-primary" onClick={handleSubmit(executeTransaction(false))}>Mint</button> : <></>
            )
            : <p>Connect a wallet to mint</p>
          }
        </div>
      </div>
      <MintConfirmModal isOpen={confirmModalOpen} setIsOpen={setConfirmModalOpen} onClose={(confirmed) => handleSubmit(executeTransaction(confirmed))()} />
    </div>
  )
}