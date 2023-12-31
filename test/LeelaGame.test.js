const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
  loadFixture,
} = require('@nomicfoundation/hardhat-toolbox/network-helpers');

const Action = {
  Created: 0,
  Updated: 1,
  Deleted: 2,
};

describe('LeelaGame', function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const leelaGame = await ethers.deployContract('LeelaGame');

    await leelaGame.waitForDeployment();

    return { leelaGame, owner, addr1, addr2 };
  }

  it('Should allow creating or updating a player', async function () {
    const { leelaGame, owner } = await loadFixture(deployTokenFixture);

    const createPlayerTx = await leelaGame.createOrUpdateOrDeletePlayer(
      'Player 1',
      'Avatar 1',
      'Intention 1',
      Action.Created,
    );
    await createPlayerTx.wait();

    let player = await leelaGame.getPlayer(owner.address);
    expect(player.fullName).to.equal('Player 1');
    expect(player.avatar).to.equal('Avatar 1');
    expect(player.intention).to.equal('Intention 1');
    expect(player.plan).to.equal(0);

    const updatePlayerTx = await leelaGame.createOrUpdateOrDeletePlayer(
      'Updated Player',
      'Updated Avatar',
      'Updated Intention',
      Action.Updated,
    );
    await updatePlayerTx.wait();

    player = await leelaGame.getPlayer(owner.address);
    expect(player.fullName).to.equal('Updated Player');
    expect(player.avatar).to.equal('Updated Avatar');
    expect(player.intention).to.equal('Updated Intention');
  });

  it('Should roll the dice until the game is won', async function () {
    const { leelaGame, owner } = await loadFixture(deployTokenFixture);
    let gameStatus;
    let attempts = 0;
    const maxAttempts = 999;

    // Create a player
    const createPlayerTx = await leelaGame.createOrUpdateOrDeletePlayer(
      'Player 1',
      'Avatar 1',
      'Intention 1',
      Action.Created,
    );
    await createPlayerTx.wait();

    do {
      const rollResult = Math.floor(Math.random() * 6) + 1;
      const rollDiceTx = await leelaGame.rollDice(rollResult);
      const receipt = await rollDiceTx.wait();

      gameStatus = await leelaGame.checkGameStatus(owner.address);

      if (receipt.logs.length > 0) {
        const diceRolledEvent = receipt.logs[0];
        const currentRollResult = Number(diceRolledEvent.args.rolled);

        if (gameStatus.isStart) {
          const createReportTx = await leelaGame.createReport('Turn report');
          await createReportTx.wait();
        }
      }

      attempts++;
    } while (!gameStatus.isFinished && attempts < maxAttempts);

    console.log(`Game won after ${attempts} attempts.`);
    expect(gameStatus.isFinished).to.equal(true);
  });

  it('Players can create, update, and delete reports', async function () {
    const { leelaGame, owner } = await loadFixture(deployTokenFixture);
    // Create a player
    const createPlayerTx = await leelaGame.createOrUpdateOrDeletePlayer(
      'Player 1',
      'Avatar 1',
      'Intention 1',
      Action.Created,
    );
    await createPlayerTx.wait();

    // Start the game by rolling a 6
    let roll = 0;
    while (roll !== 6) {
      const rollResult = Math.floor(Math.random() * 6) + 1;
      const rollDiceTx = await leelaGame.rollDice(rollResult);
      const receipt = await rollDiceTx.wait();

      if (receipt.logs.length > 0) {
        const diceRolledEvent = receipt.logs[0];
        roll = Number(diceRolledEvent.args.rolled);
      }
    }

    // Create a report after starting the game
    const createReportTx = await leelaGame.createReport('Turn report');
    await createReportTx.wait();

    // Get all reports and check if the created report exists
    const allReports = await leelaGame.getAllReports();
    const lastReport = allReports[allReports.length - 1];

    expect(lastReport.reporter).to.equal(owner.address);
    expect(lastReport.content).to.equal('Turn report');

    // Update the report's content
    const updateReportTx = await leelaGame.updateReportContent(
      lastReport.reportId,
      'Updated report content',
    );
    await updateReportTx.wait();

    // Get the updated report and check if the content is updated
    const updatedReport = await leelaGame.getReport(lastReport.reportId);
    expect(updatedReport.content).to.equal('Updated report content');

    // Delete the report
    const deleteReportTx = await leelaGame.deleteReport(lastReport.reportId);
    await deleteReportTx.wait();

    // Get the deleted report and check if the content is updated
    const deletedReport = await leelaGame.getReport(lastReport.reportId);
    expect(deletedReport.content).to.equal('This report has been deleted.');
  });

  it('Player can only start the game after rolling a 6', async function () {
    const { leelaGame, owner } = await loadFixture(deployTokenFixture);
    // Create a player
    const createPlayerTx = await leelaGame.createOrUpdateOrDeletePlayer(
      'Player 1',
      'Avatar 1',
      'Intention 1',
      Action.Created,
    );
    await createPlayerTx.wait();

    let rollResult = 0;
    while (rollResult !== 6) {
      rollResult = Math.floor(Math.random() * 6) + 1;
      // console.log('rollResult', rollResult);
      const rollDiceTx = await leelaGame.rollDice(rollResult); // Pass the rollResult to the rollDice function
      const receipt = await rollDiceTx.wait();

      if (receipt.logs.length > 0) {
        const diceRolledEvent = receipt.logs[0];
        const currentRollResult = Number(diceRolledEvent.args.rolled);
        const plan = await leelaGame.getPlanHistory(owner.address);
        // console.log('plan', plan);
        const [isStart] = await leelaGame.checkGameStatus(owner.address);
        // console.log('isStart', isStart);
        rollResult = currentRollResult; // Update the rollResult with the current roll
      }
    }

    const [isStart] = await leelaGame.checkGameStatus(owner.address);
    expect(isStart).to.equal(true);
  });

  it('Players can add, update, and delete comments', async function () {
    const { leelaGame, owner } = await loadFixture(deployTokenFixture);
    // Create a player
    const createPlayerTx = await leelaGame.createOrUpdateOrDeletePlayer(
      'Player 1',
      'Avatar 1',
      'Intention 1',
      Action.Created,
    );
    await createPlayerTx.wait();
    // Start the game by rolling a 6
    let roll = 0;
    while (roll !== 6) {
      const rollResult = Math.floor(Math.random() * 6) + 1;
      const rollDiceTx = await leelaGame.rollDice(rollResult);
      const receipt = await rollDiceTx.wait();

      if (receipt.logs.length > 0) {
        const diceRolledEvent = receipt.logs[0];
        roll = Number(diceRolledEvent.args.rolled);
      }
    }

    // Create a report after starting the game
    const createReportTx = await leelaGame.createReport('Turn report');
    await createReportTx.wait();

    // Get all reports and get the last one
    const allReports = await leelaGame.getAllReports();
    const lastReport = allReports[allReports.length - 1];

    // Add a comment to the report
    const addCommentTx = await leelaGame.addComment(
      lastReport.reportId,
      'Test Comment',
    );
    await addCommentTx.wait();

    // Get the report's comments and check if the comment exists
    const reportComments = await leelaGame.getAllCommentsForReport(
      lastReport.reportId,
    );
    const lastComment = reportComments[reportComments.length - 1];
    expect(lastComment.commenter).to.equal(owner.address);
    expect(lastComment.content).to.equal('Test Comment');

    // Update the comment's content
    const updateCommentTx = await leelaGame.updateCommentContent(
      lastComment.commentId,
      'Updated comment content',
    );
    await updateCommentTx.wait();

    // Get the updated comment and check if the content is updated
    const allCommentsForReport = await leelaGame.getAllCommentsForReport(
      lastComment.reportId,
    );

    const updatedComment =
      allCommentsForReport[allCommentsForReport.length - 1];
    expect(updatedComment.content).to.equal('Updated comment content');

    // Delete the comment
    const deleteCommentTx = await leelaGame.deleteComment(
      lastComment.commentId,
    );
    await deleteCommentTx.wait();

    // Get the comments for the report and check if the comment is deleted
    const remainingCommentsForReport = await leelaGame.getAllCommentsForReport(
      lastComment.reportId,
    );

    const deletedComment = remainingCommentsForReport.find(
      (comment) => comment.commentId === lastComment.commentId,
    );
    expect(deletedComment).to.be.undefined;
  });

  it('Should only allow valid roll results for rollDice', async function () {
    const { leelaGame } = await loadFixture(deployTokenFixture);

    // Create a player
    const createPlayerTx = await leelaGame.createOrUpdateOrDeletePlayer(
      'Player 1',
      'Avatar 1',
      'Intention 1',
      Action.Created,
    );
    await createPlayerTx.wait();

    // Try rolling with an invalid roll result (0)
    await expect(leelaGame.rollDice(0)).to.be.revertedWith(
      'Invalid roll result: rollResult >= 1 && rollResult <= MAX_ROLL',
    );

    // Try rolling with an invalid roll result (greater than 6)
    await expect(leelaGame.rollDice(7)).to.be.revertedWith(
      'Invalid roll result: rollResult >= 1 && rollResult <= MAX_ROLL',
    );

    // Try rolling with a valid roll result
    const validRollResult = 4;
    await leelaGame.rollDice(validRollResult);
  });

  it('Should allow toggling like for a report', async function () {
    const { leelaGame, owner, addr1 } = await loadFixture(deployTokenFixture);

    const createPlayerTx = await leelaGame.createOrUpdateOrDeletePlayer(
      'Player 1',
      'Avatar 1',
      'Intention 1',
      Action.Created,
    );
    await createPlayerTx.wait();
    const rollDiceTx = await leelaGame.rollDice(6);
    await rollDiceTx.wait();

    const createReportTx = await leelaGame.createReport('Test report');
    const createReportReceipt = await createReportTx.wait();

    const reportId = createReportReceipt.logs[0].args[0];

    // Like the report
    const toggleLike = await leelaGame.toggleLikeReport(reportId, true);

    const reportWithLikes = await leelaGame.getReport(reportId);

    expect(reportWithLikes.likes).to.equal(1);

    // Unlike the report
    await leelaGame.toggleLikeReport(reportId, false);
    const reportWithUnlikes = await leelaGame.getReport(reportId);

    expect(reportWithUnlikes.likes).to.equal(0);
  });
});
