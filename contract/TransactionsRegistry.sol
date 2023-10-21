// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TransactionsRegistry {
    // Struct to represent a UserTransaction
    struct UserTransaction {
        string title;
        uint256 amount;
        string date;
    }

    struct UserSpareData {
        uint256 currenSpareAmount;
        uint256 totalInvestedAmount;
    }

    // Mapping to store the transactions for each user
    mapping(address => UserTransaction[]) public userTransactions;

    // Mapping to store the spare data for each user
    mapping(address => UserSpareData) public userSpareData;

    // Event emitted when a new transaction is uploaded
    event TransactionUploaded(string title, uint256 amount, string date);

    // Function to upload a new transaction and store the resulting hash in the array
    function uploadTransaction (string memory title, uint256 amount, string memory date, uint256 roundup) public {
        // Create a new transaction struct
        UserTransaction memory newTransaction = UserTransaction(title, amount, date);
        userSpareData[msg.sender].currenSpareAmount += roundup;
        userTransactions[msg.sender].push(newTransaction);
        emit TransactionUploaded(title, amount, date);
    }


    // Function to get the total number of uploaded transactions for a specific user
    function getTransactionCount(address user) public view returns (uint256) {
        return userTransactions[user].length;
    }

    // Function to get a specific transaction by index for a specific user
    function getTransaction(address user, uint256 index) public view returns (string memory, string memory) {
        return (userTransactions[user][index].title, userTransactions[user][index].date);
    }

    // Function to get all uploaded transactions for a specific user
    function getAllTransactions(address user) public view returns (UserTransaction[] memory) {
        return userTransactions[user];
    }

    // Function to get the spare data for a specific user
    function getSpareData(address user) public view returns (UserSpareData memory) {
        return userSpareData[user];
    }

    // Function to update the spare data for a specific user
    function updateSpareData(address user, uint256 currenSpareAmount, uint256 totalInvestedAmount) public {
        userSpareData[user].currenSpareAmount = currenSpareAmount;
        userSpareData[user].totalInvestedAmount = totalInvestedAmount;
    }

    function investSpareAmount(address user, uint256 amount) public {
        userSpareData[user].currenSpareAmount -= amount;
        userSpareData[user].totalInvestedAmount += amount;
    }

    
}
