// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LeelaGame {
  uint8 constant MAX_ROLL = 6;
  uint8 constant WIN_PLAN = 68;
  uint8 constant TOTAL_PLANS = 72;

  constructor() {
    Player memory newPlayer;
    newPlayer.plan = 68;
    newPlayer.previousPlan = 68;
    players[msg.sender] = newPlayer;
  }

  event ReportAction(
    uint256 indexed reportId,
    address indexed actor,
    string content,
    uint256 plan,
    uint256 timestamp,
    ActionType action
  );

  event CommentAction(
    uint256 indexed commentId,
    uint256 indexed reportId,
    address indexed actor,
    string content,
    uint256 timestamp,
    ActionType action
  );

  enum ActionType {
    Created,
    Updated,
    Deleted
  }

  event DiceRolled(
    address indexed roller,
    uint8 indexed rolled,
    uint256 indexed currentPlan
  );

  struct Player {
    uint256 plan;
    uint256 previousPlan;
    bool isStart;
    bool isFinished;
    uint8 consecutiveSixes;
  }

  struct Comment {
    uint256 commentId;
    uint256 reportId;
    address commenter;
    string content;
    uint256 timestamp;
  }

  struct Report {
    uint256 reportId;
    address reporter;
    string content;
    uint256 plan;
    uint256 timestamp;
    uint256[] commentIds;
  }

  uint256 private reportIdCounter;
  uint256 private commentIdCounter;

  mapping(uint256 => Report) public reports;
  mapping(uint256 => Comment) public comments;

  mapping(address => Player) public players;
  mapping(address => uint8[]) public playerRolls;
  mapping(address => uint256[]) public playerPlans;
  mapping(address => bool) public playerReportCreated;

  function rollDice(uint8 rollResult) external {
    require(rollResult >= 1 && rollResult <= MAX_ROLL, 'Invalid roll result.');

    playerRolls[msg.sender].push(rollResult);

    Player storage player = players[msg.sender];

    if (player.isStart) {
      require(
        reports[reportIdCounter].reporter == msg.sender,
        'You must create a report before rolling the dice.'
      );
    }

    if (!player.isStart && rollResult == 6) {
      player.plan = 6;
      player.isStart = true;
      player.consecutiveSixes = 1;
      playerPlans[msg.sender].push(6);
      emit DiceRolled(msg.sender, rollResult, 6);
    } else if (player.isStart) {
      handleRollResult(rollResult, msg.sender);
    }
  }

  function handleRollResult(uint8 roll, address playerAddress) private {
    Player storage player = players[playerAddress];

    if (roll == MAX_ROLL) {
      player.consecutiveSixes += 1;
      if (player.consecutiveSixes == 3) {
        player.plan = player.previousPlan;
        player.consecutiveSixes = 0;
        return;
      }
    } else {
      player.consecutiveSixes = 0;
    }

    movePlayer(roll, playerAddress);
  }

  function movePlayer(uint8 roll, address playerAddress) private {
    Player storage player = players[playerAddress];
    player.previousPlan = player.plan;
    uint256 newPlan = player.plan + roll;

    // Snakes that lead the player downwards
    if (newPlan > TOTAL_PLANS) {
      newPlan = player.plan;
    }
    if (newPlan == 12) {
      newPlan = 8;
    } else if (newPlan == 16) {
      newPlan = 4;
    } else if (newPlan == 24) {
      newPlan = 7;
    } else if (newPlan == 29) {
      newPlan = 6;
    } else if (newPlan == 44) {
      newPlan = 9;
    } else if (newPlan == 52) {
      newPlan = 35;
    } else if (newPlan == 55) {
      newPlan = 3;
    } else if (newPlan == 61) {
      newPlan = 13;
    } else if (newPlan == 63) {
      newPlan = 2;
    } else if (newPlan == 72) {
      newPlan = 51;
    }
    // Arrows that lead the player upwards
    else if (newPlan == 10) {
      newPlan = 23;
    } else if (newPlan == 17) {
      newPlan = 69;
    } else if (newPlan == 20) {
      newPlan = 32;
    } else if (newPlan == 22) {
      newPlan = 60;
    } else if (newPlan == 27) {
      newPlan = 41;
    } else if (newPlan == 28) {
      newPlan = 50;
    } else if (newPlan == 37) {
      newPlan = 66;
    } else if (newPlan == 45) {
      newPlan = 67;
    } else if (newPlan == 46) {
      newPlan = 62;
    } else if (newPlan == 54) {
      newPlan = 68;
    } else if (newPlan > TOTAL_PLANS) {
      // Player overshoots the goal, stays in place
      newPlan = player.plan;
    }

    player.plan = newPlan;
    playerPlans[playerAddress].push(newPlan);

    // Check for finish
    if (newPlan == WIN_PLAN) {
      player.isFinished = true;
      player.previousPlan = newPlan;
      player.isStart = false;
    }
    emit DiceRolled(playerAddress, roll, newPlan);
  }

  function getRollHistory(address player) public view returns (uint8[] memory) {
    return playerRolls[player];
  }

  function checkGameStatus(
    address playerAddress
  ) public view returns (bool isStart, bool isFinished) {
    Player storage player = players[playerAddress];
    return (player.isStart, player.isFinished);
  }

  function getPlanHistory(
    address player
  ) public view returns (uint256[] memory) {
    return playerPlans[player];
  }

  function createReport(string memory content) external {
    uint256 currentPlan = players[msg.sender].plan;
    require(
      players[msg.sender].isStart,
      'You must start the game before creating a report.'
    );

    reportIdCounter++; // Увеличиваем счетчик

    reports[reportIdCounter] = Report({
      reportId: reportIdCounter, // Сохраняем reportId
      reporter: msg.sender,
      content: content,
      plan: currentPlan,
      timestamp: block.timestamp,
      commentIds: new uint256[](0)
    });

    playerReportCreated[msg.sender] = true;

    emit ReportAction(
      reportIdCounter,
      msg.sender,
      content,
      currentPlan,
      block.timestamp,
      ActionType.Created
    );
  }

  function updateReportContent(
    uint256 reportId,
    string memory newContent
  ) external {
    Report storage report = reports[reportId];
    require(
      report.reporter == msg.sender,
      'Only the reporter can update the report.'
    );
    report.content = newContent;

    emit ReportAction(
      reportId,
      msg.sender,
      newContent,
      report.plan,
      block.timestamp,
      ActionType.Updated
    );
  }

  function deleteReport(uint256 reportId) external {
    require(reportId <= reportIdCounter && reportId > 0, 'Invalid report ID.');
    Report storage report = reports[reportId];
    require(
      report.reporter == msg.sender,
      'Only the reporter can delete the report.'
    );
    report.content = 'This report has been deleted.';

    emit ReportAction(
      reportId,
      msg.sender,
      'This report has been deleted.',
      report.plan,
      block.timestamp,
      ActionType.Deleted
    );
  }

  function getAllReports() external view returns (Report[] memory) {
    Report[] memory allReports = new Report[](reportIdCounter);
    for (uint256 i = 1; i <= reportIdCounter; i++) {
      allReports[i - 1] = reports[i];
    }
    return allReports;
  }

  function getReport(uint256 reportId) external view returns (Report memory) {
    require(reportId <= reportIdCounter && reportId > 0, 'Invalid report ID.');
    return reports[reportId];
  }

  function getAllCommentsForReport(
    uint256 reportId
  ) external view returns (Comment[] memory) {
    Report storage report = reports[reportId];
    uint256[] storage commentIds = report.commentIds;

    Comment[] memory allComments = new Comment[](commentIds.length);

    for (uint256 i = 0; i < commentIds.length; i++) {
      allComments[i] = comments[commentIds[i]];
    }

    return allComments;
  }

  function addComment(uint256 reportId, string memory content) external {
    Report storage report = reports[reportId];
    require(report.reporter != address(0), 'Report does not exist.');

    commentIdCounter++;

    comments[commentIdCounter] = Comment({
      commentId: commentIdCounter,
      reportId: reportId,
      commenter: msg.sender,
      content: content,
      timestamp: block.timestamp
    });

    report.commentIds.push(commentIdCounter);

    emit CommentAction(
      commentIdCounter,
      reportId,
      msg.sender,
      content,
      block.timestamp,
      ActionType.Created
    );
  }

  function updateCommentContent(
    uint256 commentId,
    string memory newContent
  ) external {
    Comment storage comment = comments[commentId];
    require(
      comment.commenter == msg.sender,
      'Only the commenter can update the comment.'
    );

    comment.content = newContent;

    emit CommentAction(
      commentId,
      comment.reportId,
      msg.sender,
      newContent,
      block.timestamp,
      ActionType.Updated
    );
  }

  function deleteComment(uint256 commentId) external {
    Comment storage comment = comments[commentId];
    require(
      comment.commenter == msg.sender,
      'Only the commenter can delete the comment.'
    );

    delete comments[commentId];

    // Remove the commentId from the commentIds array in the corresponding report
    uint256[] storage reportCommentIds = reports[comment.reportId].commentIds;
    for (uint256 i = 0; i < reportCommentIds.length; i++) {
      if (reportCommentIds[i] == commentId) {
        reportCommentIds[i] = reportCommentIds[reportCommentIds.length - 1];
        reportCommentIds.pop();
        break;
      }
    }

    emit CommentAction(
      commentId,
      comment.reportId,
      msg.sender,
      comment.content,
      block.timestamp,
      ActionType.Deleted
    );
  }
}
