import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftTransfer } from "../target/types/nft_transfer";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { min } from "bn.js";




describe("solana-nft-anchor", async () => {


  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace
    .NftTransfer as Program<NftTransfer>;

  const signer = provider.wallet;

  const umi = createUmi("https://api.devnet.solana.com")
    .use(walletAdapterIdentity(signer))
    .use(mplTokenMetadata());

  const mint = anchor.web3.Keypair.generate();

  const to_account = anchor.web3.Keypair.generate();


  // Derive the associated token address account for the mint
  const associatedTokenAccount = await getAssociatedTokenAddress(
    mint.publicKey,
    signer.publicKey
  );


  const toAssociatedTokenAccount = await getAssociatedTokenAddress(
    mint.publicKey,
    to_account.publicKey
  );


  const metadata = {
    name: "Minddeft",
    symbol: "MD",
    uri: "https://raw.githubusercontent.com/MD-RanaHardik/SushiSwapSolana/main/metadata.json",
  };

  it("mints nft!", async () => {

    const tx = await program.methods
      .createNft(metadata.name, metadata.symbol, metadata.uri)
      .accounts({
        signer: signer.publicKey,
        mint: mint.publicKey,
        associatedTokenAccount,
      })
      .signers([mint])
      .rpc();

    console.log(
      `mint nft tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
    console.log(
      `minted nft: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
    );
  });


  it("transfer nft from  wallet", async () => {

    const tx = await program.methods
      .transferNftFromWallet()
      .accounts({
        mint: mint.publicKey,
        signer: signer.publicKey,
        fromTokenAccount: associatedTokenAccount,
        toTokenAccount: toAssociatedTokenAccount,
      }).rpc().catch((e) => {
        console.log(e);
      })


    console.log(
      `transfer nft from wallet tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
    console.log(
      `transfer nft from wallet : https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
    );
  });


  it("transfer nft from  pda", async () => {

    const tx = await program.methods
      .transferNftFromPda()
      .accounts({
        mint: mint.publicKey,
        payer: provider.publicKey,
        fromTokenAccount: toAssociatedTokenAccount,
        toTokenAccount: associatedTokenAccount,
      })
      .signers([])
      .rpc().catch((e) => {
        console.log(e);
      });

    console.log(
      `transfer nft from pda tx: https://explorer.solana.com/tx/${tx}?cluster=devnet`
    );
    console.log(
      `transfer nft from pda : https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`
    );
  });


});