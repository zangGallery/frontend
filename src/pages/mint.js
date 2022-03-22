import React, { useState } from "react";
import { ethers } from "ethers";
import { v1 } from '../common/abi';
import config from '../config'
import { ensProvider, useWalletProvider } from "../common/provider";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import Decimal from "decimal.js";
import { useForm } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi"
import { schemas } from "../common";
import { MintConfirmModal, MultiEditor, RoutingLink } from "../components";
import { Header } from "../components";
import { Helmet } from "react-helmet";

import "bulma/css/bulma.min.css";
import '../styles/globals.css'
import { useTransactionHelper } from "../common/transaction_status";
import { useRecoilState } from 'recoil';
import { standardErrorState } from '../common/error';
import StandardErrorDisplay from "../components/StandardErrorDisplay";
import ValidatedInput from "../components/ValidatedInput";
import ViewOnExplorer from "../components/ViewOnExplorer";

const defaultValues = {
  editionSize: 1,
  royaltyPercentage: 10,
  useCustomRecipient: false,
  textType: 'text/plain'
}

export default function Mint() {
  const { register, formState: { errors, isValid }, handleSubmit, watch } = useForm({ defaultValues: defaultValues, mode: 'onChange', resolver: joiResolver(schemas.mint)});
  const [text, setText] = useState('')
  const [walletProvider,] = useWalletProvider()
  const [transactionState,] = useState({ status: 'noTransaction'})
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const watchUseCustomRecipient = watch('useCustomRecipient', defaultValues.useCustomRecipient);
  const watchTextType = watch('textType', defaultValues.textType)
  const handleTransaction = useTransactionHelper()
  const [, setStandardError] = useRecoilState(standardErrorState)

  const executeTransaction = (mintConfirmed)  => async (data) => {
    if (!walletProvider) {
      setStandardError('Please connect a wallet.')
      return;
    }
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
                + (isUTF8() && data.textType === 'text/plain' ? ',charset=UTF-8' : '')
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
          resolvedAddress = await ensProvider.resolveName(effectiveRoyaltyRecipient);
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

    const contentFunction = (status, transaction, success, receipt) => {
      console.log('Calling content function')
      if (status !== 'success') {
        return null;
      }
      
      if (success && receipt && receipt.blockNumber) {
        const matchingEvents = receipt.events.filter(event => event.event === 'TransferSingle' && event.args.from === 0)
        if (matchingEvents.length === 1) {
          const tokenId = matchingEvents[0].args[3].toString();
          return (
            <div>
              <p><RoutingLink className="is-underlined" href={'/nft?id=' + tokenId}>NFT #{tokenId}</RoutingLink> minted</p>
              <p><ViewOnExplorer hash={transaction.hash} /></p>
            </div>
          )
        }
        else {
          setStandardError('Could not find token ID in transaction receipt.');
          return;
        }
      }
    }

    const transactionFunction = async () => 
      await contractWithSigner.mint(uri, data.title, data.description, data.editionSize, effectiveRoyaltyPercentage, effectiveRoyaltyRecipient, 0);

    handleTransaction(transactionFunction, 'Mint', contentFunction);
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
          <ValidatedInput label="Title" name="title" type="text" register={register} errors={errors} />
          <ValidatedInput label="Description" name="description" type="text" register={register} errors={errors} />
          <ValidatedInput label="Edition size" name="editionSize" type="number" register={register} errors={errors} />
          <div className="field">
            <label className="label" htmlFor="content">Content</label>
            <div className="control">
              <div className="select">
                <select {...register('textType')} id="content">
                  <option value='text/plain'>Plain Text</option>
                  <option value='text/markdown'>Markdown</option>
                </select>
              </div>
            </div>
            <div className="control mt-3">
              <MultiEditor textType={watchTextType} value={text} setValue={setText} />
            </div>
          </div>
          <ValidatedInput label="Royalty percentage" name="royaltyPercentage" type="number" defaultValue="10" min="0" max="100" step="0.01" register={register} errors={errors} />
          <div className="field">
          <label className="checkbox label">
            <input type="checkbox" {...register('useCustomRecipient')} className="mr-1" />
              Custom royalty recipient
            </label>
            
          </div>
          {
            watchUseCustomRecipient ? (
              <ValidatedInput label="Address" name="customRecipient" type="text" placeholder="0x... or ENS address" register={register} errors={errors} />
            ) : <></>
          }
          <div className="notification is-danger">
            <p><strong>Important</strong>: zang.gallery currently uses <strong>{config.networks.main.name}</strong>. Make sure that you're signing a transaction on the Polygon network!</p>
          </div>
          {
            walletProvider ? (
              transactionState.status === 'noTransaction' || transactionState.status === 'error' ?
                <button className="button is-primary" disabled={!isValid} onClick={handleSubmit(executeTransaction(false))}>Mint</button> : <></>
            )
            : <p>Connect a wallet to mint</p>
          }
        </div>
      </div>
      <MintConfirmModal isOpen={confirmModalOpen} setIsOpen={setConfirmModalOpen} onClose={(confirmed) => handleSubmit(executeTransaction(confirmed))()} />
    </div>
  )
}