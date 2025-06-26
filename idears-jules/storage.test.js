const fs = require('fs');
const { loadIdeas, saveIdeas } = require('./storage'); // Assuming storage.js is in the same directory

jest.mock('fs');

describe('Storage Functions', () => {
    const mockIdeas = [{ id: '1', text: 'Test Idea', votes: 0 }];
    const ideasFilePath = expect.stringMatching(/data(\/|\\)ideas.json$/); // Path.join will use / or \

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });

    describe('loadIdeas', () => {
        it('should return ideas from file if it exists and contains valid JSON', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue(JSON.stringify(mockIdeas));

            const ideas = loadIdeas();
            expect(fs.existsSync).toHaveBeenCalledWith(ideasFilePath);
            expect(fs.readFileSync).toHaveBeenCalledWith(ideasFilePath, 'utf8');
            expect(ideas).toEqual(mockIdeas);
        });

        it('should return an empty array if file does not exist', () => {
            fs.existsSync.mockReturnValue(false);

            const ideas = loadIdeas();
            expect(fs.existsSync).toHaveBeenCalledWith(ideasFilePath);
            expect(fs.readFileSync).not.toHaveBeenCalled();
            expect(ideas).toEqual([]);
        });

        it('should return an empty array if file contains invalid JSON', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('invalid json');
            console.error = jest.fn(); // Mock console.error to suppress expected error messages

            const ideas = loadIdeas();
            expect(fs.existsSync).toHaveBeenCalledWith(ideasFilePath);
            expect(fs.readFileSync).toHaveBeenCalledWith(ideasFilePath, 'utf8');
            expect(ideas).toEqual([]);
            expect(console.error).toHaveBeenCalled(); // Ensure error was logged
        });

        it('should return an empty array if readFileSync throws an error', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockImplementation(() => { throw new Error('Read error'); });
            console.error = jest.fn();

            const ideas = loadIdeas();
            expect(ideas).toEqual([]);
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('saveIdeas', () => {
        it('should write ideas to file and create data directory if it does not exist', () => {
            fs.existsSync.mockReturnValue(false); // data directory does not exist

            saveIdeas(mockIdeas);

            expect(fs.existsSync).toHaveBeenCalledWith(expect.stringMatching(/data$/));
            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringMatching(/data$/), { recursive: true });
            expect(fs.writeFileSync).toHaveBeenCalledWith(ideasFilePath, JSON.stringify(mockIdeas, null, 2), 'utf8');
        });

        it('should write ideas to file when data directory already exists', () => {
            fs.existsSync.mockReturnValue(true); // data directory exists

            saveIdeas(mockIdeas);

            expect(fs.existsSync).toHaveBeenCalledWith(expect.stringMatching(/data$/));
            expect(fs.mkdirSync).not.toHaveBeenCalled();
            expect(fs.writeFileSync).toHaveBeenCalledWith(ideasFilePath, JSON.stringify(mockIdeas, null, 2), 'utf8');
        });

        it('should log an error if writeFileSync throws an error', () => {
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => { throw new Error('Write error'); });
            console.error = jest.fn();

            saveIdeas(mockIdeas);
            expect(console.error).toHaveBeenCalled();
        });
    });
});
