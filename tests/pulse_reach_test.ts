import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Can register new professional profile",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'register-professional', [
        types.ascii("Dr. John Doe"),
        types.ascii("MD, Cardiology Board Certified"),
        types.ascii("Cardiology")
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Verify profile data
    let getProfile = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'get-professional', [
        types.principal(wallet1.address)
      ], deployer.address)
    ]);
    
    const profile = getProfile.receipts[0].result.expectOk().expectSome();
    assertEquals(profile['verified'], types.bool(false));
  }
});

Clarinet.test({
  name: "Owner can verify professionals and mint reward tokens",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    // First register a professional
    let block = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'register-professional', [
        types.ascii("Dr. John Doe"),
        types.ascii("MD, Cardiology Board Certified"),
        types.ascii("Cardiology")
      ], wallet1.address)
    ]);
    
    // Then verify them
    let verifyBlock = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'verify-professional', [
        types.principal(wallet1.address)
      ], deployer.address)
    ]);
    
    verifyBlock.receipts[0].result.expectOk().expectBool(true);
    
    // Check they received tokens
    let getProfile = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'get-professional', [
        types.principal(wallet1.address)
      ], deployer.address)
    ]);
    
    const profile = getProfile.receipts[0].result.expectOk().expectSome();
    assertEquals(profile['verified'], types.bool(true));
  }
});

Clarinet.test({
  name: "Can create and like posts",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    // Create post
    let postBlock = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'create-post', [
        types.utf8("New research findings on cardiac treatments")
      ], wallet1.address)
    ]);
    
    const postId = postBlock.receipts[0].result.expectOk();
    
    // Like post
    let likeBlock = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'like-post', [
        postId
      ], wallet2.address)
    ]);
    
    likeBlock.receipts[0].result.expectOk().expectBool(true);
    
    // Verify post data
    let getPost = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'get-post', [
        postId
      ], wallet1.address)
    ]);
    
    const post = getPost.receipts[0].result.expectOk().expectSome();
    assertEquals(post['likes'], types.uint(1));
  }
});

Clarinet.test({
  name: "Can create and join collaborations", 
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    // Create collaboration
    let collabBlock = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'create-collaboration', [
        types.ascii("Cardiac Research Group"),
        types.utf8("Researching new treatments for heart disease")
      ], wallet1.address)
    ]);
    
    const collabId = collabBlock.receipts[0].result.expectOk();
    
    // Join collaboration
    let joinBlock = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'join-collaboration', [
        collabId
      ], wallet2.address)
    ]);
    
    joinBlock.receipts[0].result.expectOk().expectBool(true);
    
    // Verify collaboration data
    let getCollab = chain.mineBlock([
      Tx.contractCall('pulse_reach', 'get-collaboration', [
        collabId
      ], wallet1.address)
    ]);
    
    const collab = getCollab.receipts[0].result.expectOk().expectSome();
    assertEquals(collab['members'].length, 2);
  }
});