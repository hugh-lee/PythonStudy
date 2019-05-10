import os
import sys
import argparse
import csv


def generate_csv_file(path):
    with open("test.csv", "w") as csvfile:
        writer = csv.writer(csvfile)
        # write columns_name
        writer.writerow(['wav_filename', 'wav_filesize', 'transcript'])
        files = os.listdir(path)
        for file in files:
            if os.path.isdir(file):
                continue

            file_infos = os.path.splitext(file)
            if file_infos[1] != '.wav' and file_infos[1] != '.mp3':
                continue

            print('Reading file: {}'.format(file), file=sys.stdout)

            file_name = file_infos[0].replace('_', ' ').replace('.', ' ').lower()
            file_path = path + "/" + file
            file_size = os.path.getsize(file_path)
            writer.writerows([[file_path, file_size, file_name]])


def main():
    parser = argparse.ArgumentParser(description='Running DeepSpeech Training Data generation inference.')
    parser.add_argument('--path', required=True, help='Path to the wav file list')
    args = parser.parse_args()

    print('Reading audio files from {}'.format(args.path), file=sys.stderr)
    generate_csv_file(args.path)


if __name__ == '__main__':
    main()
