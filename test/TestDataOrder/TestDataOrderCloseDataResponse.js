import createDataOrder from './helpers/dataOrderCreation';
import { assertRevert } from '../helpers';

const web3Utils = require('web3-utils');

contract('DataOrder', (accounts) => {
  const notary = accounts[1];
  const buyer = accounts[4];
  const seller = accounts[5];
  const owner = accounts[6];
  const notOwner = accounts[7];
  const dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';

  let order;

  beforeEach('setup DataOrder for each test', async () => {
    order = await createDataOrder({ buyer, from: owner });
    await order.addNotary(notary, 10, 1, 'terms', { from: owner });
  });

  describe('closeDataResponse', () => {
    it('can not close a DataResponse of a closed DataOrder', async () => {
      const closeOrder = await createDataOrder({ buyer, from: owner });
      await closeOrder.close({ from: owner });

      try {
        await closeOrder.closeDataResponse(seller, true, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if Seller is 0x0', async () => {
      try {
        await order.closeDataResponse('0x0', true, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if Seller is the DataOrder contract', async () => {
      try {
        await order.closeDataResponse(order.address, true, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if Seller has not provided a DataResponse', async () => {
      try {
        await order.closeDataResponse(seller, true, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close an already-closed DataResponse', async () => {
      await order.addDataResponse(seller, notary, dataHash, { from: owner });
      await order.closeDataResponse(seller, true, { from: owner });

      try {
        await order.closeDataResponse(seller, true, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if sender is not the Owner', async () => {
      try {
        await order.closeDataResponse(seller, true, { from: notOwner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('closes an accepted DataResponse', async () => {
      await order.addDataResponse(seller, notary, dataHash, { from: owner });

      const dataResponseClosed = await order.closeDataResponse(seller, true, { from: owner });
      assert(dataResponseClosed, 'DataResponse was not closed correctly');

      const sellerInfo = await order.getSellerInfo(seller);
      assert.equal(
        web3Utils.hexToUtf8(sellerInfo[5]),
        'TransactionCompleted',
        'SellerInfo status does not match',
      );
    });

    it('closes a DataResponse that was not accepted', async () => {
      await order.addDataResponse(seller, notary, dataHash, { from: owner });

      const dataResponseClosed = await order.closeDataResponse(seller, false, { from: owner });
      assert(dataResponseClosed, 'DataResponse was not closed correctly');

      const sellerInfo = await order.getSellerInfo(seller);
      assert.equal(
        web3Utils.hexToUtf8(sellerInfo[5]),
        'RefundedToBuyer',
        'SellerInfo status does not match',
      );
    });

    describe('unexpected cases', async () => {
      it('can not close a data response immediately after order is created', async () => {
        const anOrder = await createDataOrder({ buyer, from: owner });
        try {
          await anOrder.closeDataResponse(seller, true, { from: owner });
          assert.fail();
        } catch (error) {
          assertRevert(error);
        }
      });

      it('can not close a data response after notary is added to order', async () => {
        try {
          await order.closeDataResponse(seller, true, { from: owner });
          assert.fail();
        } catch (error) {
          assertRevert(error);
        }
      });
    });
  });
});