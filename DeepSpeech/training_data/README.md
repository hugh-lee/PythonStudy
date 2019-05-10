(env) lihus-Mac-mini:DS lihu$ python -u DeepSpeech.py --train_files data/ntelagent/test.csv --dev_files data/ntelagent/test.csv --test_files data/ntelagent/test.csv --train_batch_size 1 --dev_batch_size 1 --test_batch_size 1 --n_hidden 494 --epoch 75 --checkpoint_dir ../ntelagent2 --export_dir ../ntelagent2

(env) lihus-Mac-mini:DS lihu$ python -u DeepSpeech.py --train_files data/test/test.csv --dev_files data/test/test.csv --test_files data/test/test.csv --train_batch_size 1 --dev_batch_size 1 --test_batch_size 1 --n_hidden 494 --epoch 15 --checkpoint_dir ../test --export_dir ../test

(env) lihus-Mac-mini:DS lihu$ python3 DeepSpeech.py --n_hidden 2048 --checkpoint_dir ../deepspeech-0.4.1-checkpoint --epoch -3  --train_files data/ntelagent/test.csv --dev_files data/ntelagent/test.csv --test_files data/ntelagent/test.csv --learning_rate 0.0001 --export_dir ../ntelagent2
