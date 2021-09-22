import ftplib
import os
import pathlib

import click
from dotenv import load_dotenv
import pysftp

def clean_dir(sftp, dir, remove_dir=False):
    files = sftp.listdir(dir)

    for f in files:
        filepath = '/'.join((pathlib.Path(dir) / f).parts)
        try:
            sftp.remove(filepath)
            print('Removed', filepath)
        except IOError:
            clean_dir(sftp, filepath, remove_dir=True)
    
    if remove_dir:
        print('Removed', dir)
        sftp.rmdir(dir)

def put_r_portable(sftp, localdir, remotedir, preserve_mtime=False):
    for entry in os.listdir(localdir):
        remotepath = remotedir + "/" + entry
        localpath = os.path.join(localdir, entry)
        if not os.path.isfile(localpath):
            try:
                sftp.mkdir(remotepath)
            except OSError:     
                pass
            put_r_portable(sftp, localpath, remotepath, preserve_mtime)
        else:
            sftp.put(localpath, remotepath, preserve_mtime=preserve_mtime)  
        
        print('Copied', localpath)  


@click.command()
@click.argument('target', type=click.Choice(['alpha', 'beta', 'main']))
@click.option('--yes', is_flag=True)
@click.option('--from-folder', '--from', type=click.Path(exists=True, file_okay=False, dir_okay=True), default=None)
def main(target, from_folder, yes):
    if target != 'alpha' and not yes:
        print(f'Use --yes to deploy to {target}')
        return
    
    if target == 'main':
        target = 'www' # Internal name

    from_folder = from_folder if from_folder else './public'

    load_dotenv()

    os.system('npm run build')

    host = os.environ['FTP_HOST']
    username = os.environ['FTP_USER']
    password = os.environ['FTP_PASSWORD']

    cnopts = pysftp.CnOpts(knownhosts='known_hosts')
    cnopts.compression = True

    if target == '':
        raise ValueError('target cannot be empty.')

    #print(dir(sftpclone))
    with pysftp.Connection(host, username=username, password=password, port=22, cnopts=cnopts) as sftp:
        clean_dir(sftp, target, remove_dir=False)
        print('Cleared remote', target)
        put_r_portable(sftp, from_folder, f'./{target}')

if __name__ == '__main__':
    main()