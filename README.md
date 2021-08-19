# Ghost to Listed converter

Convert your Ghost export file into a [Standard Notes](https://standardnotes.com) import file containing notes
which can then be published directly to your [Listed](https://listed.to) blog.

## Usage

1. Clone the repository, then run `yarn install`
2. Rename `.env.sample` to `.env`, and fill in the value for `GHOST_URL`
3. Place your [Ghost export file](https://ghost.org/help/the-importer/#exports-in-ghost) in the `input` folder and name it `ghost.json`
4. In the input directory, rename `replacers.sample.json` to `replacers.json`, and populate the file as you wish. The script will replace any instances of `replace` with `with` in the resulting file.
5. In the command line, run `node script.js`.
6. Import the resulting `output/sn.json` file into your Standard Notes account.
7. Upload the resulting `output/images` file to your CDN.
8. In Standard Notes, individually publish each note to your Listed blog.

## Notes

- If you encounter an error while publishing a note to Listed, ensure the `desc` metadata field in the note has a character count of less than 250 and try again.