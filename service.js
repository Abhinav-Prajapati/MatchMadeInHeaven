class Game {
    constructor(roomId, questions) {
        this.roomId = roomId;
        this.players = {};  // Store player socket IDs
        this.playerNames = {}; // Store player names
        this.questions = questions;
        this.currentQuestionIndex = 0;
        this.totalQuestions = 0 ;
        this.answers = {};  // Store answers { player1: boolean, player2: boolean }
        this.readyPlayers = {};
        this.io = null; // Will be assigned later
        this.maxQuestions = 15;
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
  
submitAnswer(playerId, answer) {
    // Store the answer from the player
    this.answers[playerId] = answer;
    console.log(`playerId: ${playerId} answer: ${answer ? "true" : "false"}`);

    // Wait for both players to answer
    if (Object.keys(this.answers).length === 2) {
        const question = this.questions[this.currentQuestionIndex];

        // Get the two player IDs dynamically
        const playerIds = Object.keys(this.answers);
        const player1 = playerIds[0];
        const player2 = playerIds[1];

        // Compare the answers of both players
        const bothAgree = this.answers[player1] === this.answers[player2];

        console.log(`P1 ${this.answers[player1] ? 'Me' : 'Them'} P2 ${this.answers[player2] ? 'Me' : 'Them'} over all ${bothAgree ? 'Correct' : 'Wrong'}`);

        // Send the results to both players
        this.io.to(this.roomId).emit("results", {
            message: ! bothAgree ? question.correctResponse : question.falseResponse
        });
    }
}

  

    askQuestion() {
        if (this.totalQuestions < this.maxQuestions) { // TODO: hardcoded game number
            const question = this.questions[this.currentQuestionIndex];
            this.answers = {}; // Reset answers for this round
            this.io.to(this.roomId).emit("newQuestion", question.question);
        } else {
            this.io.to(this.roomId).emit("gameOver", "Game Over! Thanks for playing.");
        }
    }

      readyForNext(playerId) {
        // Mark player as ready for the next question
        this.readyPlayers[playerId] = true;

        // Check if both players are ready
        if (Object.keys(this.readyPlayers).length === 2) {
            // Both players clicked 'Next', proceed to the next question
            this.currentQuestionIndex = Math.floor(Math.random() * this.questions.length);
            this.totalQuestions++;
            this.askQuestion();
          // Reset readyPlayers for the next round
            this.readyPlayers = {};
      
        }
    }
}

module.exports = Game;
