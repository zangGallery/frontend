import os
import shutil

try:
    import dotenv
except ImportError:
    print("Please install dotenv.")

if __name__ == '__main__':
    dotenv.load_dotenv()

    with open('public/social.php', 'r+') as f:
        data = f.read()
        for key, value in os.environ.items():
            if key.startswith('POST_'):
                data = data.replace('#' + key + '#', value)
        f.seek(0)
        f.write(data)
    
    shutil.move('public/social.php', 'public/nft/index.php')
    shutil.move('public/Keccak.php', 'public/nft/Keccak.php')
    shutil.move('public/nft/index.html', 'public/nft/content.html')

    print('Finished postprocessing.')
