class Game {
    constructor(roomId, questions) {
        this.roomId = roomId;
        this.players = {};  // Store player socket IDs
        this.playerNames = {}; // Store player names
        this.questions = questions;
        this.currentQuestionIndex = 0;
        this.answers = {};  // Store answers { player1: boolean, player2: boolean }
        this.readyPlayers = 0;
        this.io = null; // Will be assigned later
    }

    setIo(io) {
        this.io = io;
    }

    addPlayer(playerId, playerName) {
        if (Object.keys(this.players).length < 2) {
            this.players[playerId] = playerName;
            this.playerNames[playerName] = playerId;
            return true;
        }
        return false; // Room is full
    }

    startGame() {
        if (Object.keys(this.players).length === 2) {
            this.askQuestion();
        }
    }

    askQuestion() {
        if (this.currentQuestionIndex < this.questions.length) {
            const question = this.questions[this.currentQuestionIndex];
            this.answers = {}; // Reset answers for this round
            this.io.to(this.roomId).emit("newQuestion", question);
        } else {
            this.io.to(this.roomId).emit("gameOver", "Game Over! Thanks for playing.");
        }
    }

    submitAnswer(playerId, answer) {
        this.answers[playerId] = answer;
        console.log(`playerId : ${playerId} answer : ${answer?"true":"false"}`)
    

        // Wait for both players to answer
        if (Object.keys(this.answers).length === 2) {
            this.io.to(this.roomId).emit("results", {
                player1: this.players[Object.keys(this.players)[0]],
                player2: this.players[Object.keys(this.players)[1]],
                answers: this.answers,
            });

            // Move to next question after a short delay
            setTimeout(() => {
                this.currentQuestionIndex++;
                this.askQuestion();
            }, 1000);
        }
    }
}

module.exports = Game;
