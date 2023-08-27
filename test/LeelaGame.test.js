const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
  loadFixture,
} = require('@nomicfoundation/hardhat-toolbox/network-helpers');

describe('LeelaGame', function () {
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const leelaGame = await ethers.deployContract('LeelaGame');

    await leelaGame.waitForDeployment();

    return { leelaGame, owner, addr1, addr2 };
  }

  it('Should roll the dice until game is won', async function () {
    const { leelaGame, owner } = await loadFixture(deployTokenFixture);
    let gameStatus;
    let attempts = 0;
    const maxAttempts = 999;
    let diceRollResult = 0;

    // Create a player
    await leelaGame.createPlayer('Player 1', 'Avatar 1', 'Intention 1');

    do {
      const rollResult = Math.floor(Math.random() * 6) + 1; // Генерируем новое значение rollResult
      const rollDiceTx = await leelaGame.rollDice(rollResult); // Используем новое значение rollResult
      const receipt = await rollDiceTx.wait();

      gameStatus = await leelaGame.checkGameStatus(owner.address);

      if (receipt.logs.length > 0) {
        const diceRolledEvent = receipt.logs[0];
        const currentRollResult = Number(diceRolledEvent.args.rolled);
        // console.log('diceRollResult', currentRollResult);
        diceRollResult = currentRollResult;
        // console.log('gameStatus.isStart', gameStatus.isStart);
        if (gameStatus.isStart) {
          const createReportTx = await leelaGame.createReport('Turn report');
          await createReportTx.wait();
        }
      }

      const planHistory = await leelaGame.getPlanHistory(owner.address);
      // console.log('planHistory', planHistory);
      attempts++;
    } while (!gameStatus.isFinished && attempts < maxAttempts);

    console.log(`Game won after ${attempts} attempts.`);
    expect(gameStatus.isFinished).to.equal(true);
  });

  it('Players can create reports after starting the game', async function () {
    const { leelaGame, owner } = await loadFixture(deployTokenFixture);
    // Create a player
    await leelaGame.createPlayer('Player 1', 'Avatar 1', 'Intention 1');
    // Start the game by rolling a 6
    let roll = 0;
    while (roll !== 6) {
      const rollResult = Math.floor(Math.random() * 6) + 1;
      // console.log('rollResult', rollResult);
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
    const updatedReport = await leelaGame.reports(lastReport.reportId);
    expect(updatedReport.content).to.equal('Updated report content');

    // Delete the report
    const deleteReportTx = await leelaGame.deleteReport(lastReport.reportId);
    await deleteReportTx.wait();

    // Get the deleted report and check if the content is updated
    const deletedReport = await leelaGame.reports(lastReport.reportId);
    expect(deletedReport.content).to.equal('This report has been deleted.');
  });

  it('Player can only start the game after rolling a 6', async function () {
    const { leelaGame, owner } = await loadFixture(deployTokenFixture);
    // Create a player
    await leelaGame.createPlayer('Player 1', 'Avatar 1', 'Intention 1');
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
    await leelaGame.createPlayer('Player 1', 'Avatar 1', 'Intention 1');
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
    await leelaGame.createPlayer('Player 1', 'Avatar 1', 'Intention 1');

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
});
