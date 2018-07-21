#!/usr/bin/env bash




rsync -avz --progress freya:~/track.areteh.co/tracks.db.sync ./tracks.db 

#sync from upstream static copy

go run dump.go -batchSize 1000000 -cpuprofile cpu.prof


go run dump.go -batchSize 1000000 

go tool pprof cpu.prof 


go tool pprof cpu.prof 




# just dumps

# Type: cpu
# Time: Jul 21, 2018 at 11:17am (CDT)
# Duration: 16.99mins, Total samples = 10.36mins (60.99%)
# Entering interactive mode (type "help" for commands, "o" for options)
# (pprof) 

# Showing top 20 nodes out of 74
#       flat  flat%   sum%        cum   cum%
#    542.88s 87.33% 87.33%    542.88s 87.33%  github.com/coreos/bbolt.(*elemRef).isLeaf
#     18.24s  2.93% 90.26%     18.25s  2.94%  syscall.Syscall
#     14.97s  2.41% 92.67%     22.77s  3.66%  encoding/json.checkValid
#      7.68s  1.24% 93.91%     12.54s  2.02%  runtime.mallocgc
#      6.98s  1.12% 95.03%      6.98s  1.12%  runtime.mach_semaphore_wait
#      4.01s  0.65% 95.68%      4.01s  0.65%  runtime.mach_semaphore_timedwait
#      3.17s  0.51% 96.19%      3.17s  0.51%  runtime.usleep
#      3.14s  0.51% 96.69%      3.14s  0.51%  runtime.mach_semaphore_signal
#      1.37s  0.22% 96.91%     20.92s  3.37%  compress/flate.(*compressor).deflate
#      0.54s 0.087% 97.00%      5.65s  0.91%  encoding/json.(*decodeState).object
#      0.27s 0.043% 97.04%      4.82s  0.78%  runtime.gcMarkDone
#      0.11s 0.018% 97.06%      3.99s  0.64%  runtime.newobject
#      0.09s 0.014% 97.07%      4.72s  0.76%  encoding/json.(*structEncoder).encode
#      0.06s 0.0097% 97.08%      7.45s  1.20%  encoding/json.stateBeginValue
#      0.05s 0.008% 97.09%      4.87s  0.78%  encoding/json.(*encodeState).reflectValue
#      0.04s 0.0064% 97.10%      9.74s  1.57%  runtime.systemstack
#      0.03s 0.0048% 97.10%     26.16s  4.21%  encoding/json.(*Encoder).Encode
#      0.03s 0.0048% 97.11%      3.68s  0.59%  encoding/json.(*mapEncoder).encode
#      0.03s 0.0048% 97.11%      4.75s  0.76%  encoding/json.(*ptrEncoder).encode
#      0.03s 0.0048% 97.12%        32s  5.15%  main.byteToFeature

channels

# Main binary filename not available.
# Type: cpu
# Time: Jul 21, 2018 at 3:08pm (CDT)
# Duration: 17.47mins, Total samples = 19.37mins (110.86%)
# Entering interactive mode (type "help" for commands, "o" for options)
# (pprof) top20
# Showing nodes accounting for 1133.42s, 97.54% of 1162.04s total
# Dropped 487 nodes (cum <= 5.81s)
# Showing top 20 nodes out of 65
#       flat  flat%   sum%        cum   cum%
#    402.67s 34.65% 34.65%    402.67s 34.65%  runtime.mach_semaphore_wait
#    370.75s 31.91% 66.56%    370.75s 31.91%  runtime.mach_semaphore_signal
#    138.75s 11.94% 78.50%    138.75s 11.94%  github.com/coreos/bbolt.(*elemRef).isLeaf (inline)
#    128.98s 11.10% 89.60%    128.98s 11.10%  runtime.usleep
#     25.16s  2.17% 91.76%     25.17s  2.17%  syscall.Syscall
#     23.87s  2.05% 93.82%     23.88s  2.06%  runtime.(*waitq).dequeue
#     20.77s  1.79% 95.60%    159.56s 13.73%  github.com/coreos/bbolt.(*Cursor).Next
#     19.07s  1.64% 97.24%     24.25s  2.09%  encoding/json.(*encodeState).marshal
#      0.73s 0.063% 97.31%    127.29s 10.95%  runtime.runqgrab
#      0.46s  0.04% 97.35%    532.49s 45.82%  runtime.findrunnable
#      0.40s 0.034% 97.38%     26.18s  2.25%  compress/flate.(*compressor).deflate
#      0.38s 0.033% 97.41%      6.51s  0.56%  encoding/json.(*decodeState).object
#      0.37s 0.032% 97.45%    247.65s 21.31%  main.dumpBolty.func1
#      0.26s 0.022% 97.47%    403.28s 34.70%  runtime.notesleep
#      0.24s 0.021% 97.49%    127.53s 10.97%  runtime.runqsteal
#      0.18s 0.015% 97.50%    576.15s 49.58%  runtime.schedule
#      0.11s 0.0095% 97.51%    406.19s 34.95%  runtime.semasleep1
#      0.09s 0.0077% 97.52%      6.26s  0.54%  runtime.gcDrain
#      0.09s 0.0077% 97.53%    406.36s 34.97%  runtime.semasleep
#      0.09s 0.0077% 97.54%    404.28s 34.79%  runtime.stopm

1 chan

# Main binary filename not available.
# Type: cpu
# Time: Jul 21, 2018 at 3:30pm (CDT)
# Duration: 12.04mins, Total samples = 10.07mins (83.66%)
# Entering interactive mode (type "help" for commands, "o" for options)
# (pprof) top20
# Showing nodes accounting for 591.95s, 97.93% of 604.47s total
# Dropped 410 nodes (cum <= 3.02s)
# Showing top 20 nodes out of 78
#       flat  flat%   sum%        cum   cum%
#    206.12s 34.10% 34.10%    206.12s 34.10%  github.com/coreos/bbolt.(*elemRef).isLeaf
#    168.33s 27.85% 61.95%    168.33s 27.85%  runtime.mach_semaphore_wait
#    130.86s 21.65% 83.60%    130.86s 21.65%  runtime.mach_semaphore_signal
#     34.71s  5.74% 89.34%     34.71s  5.74%  runtime.usleep
#     19.85s  3.28% 92.62%     19.85s  3.28%  syscall.Syscall
#     12.58s  2.08% 94.70%     18.70s  3.09%  encoding/json.checkValid
#      6.50s  1.08% 95.78%     10.60s  1.75%  encoding/json.(*encodeState).marshal
#      6.04s     1% 96.78%      9.80s  1.62%  runtime.mallocgc
#      3.83s  0.63% 97.41%      3.83s  0.63%  runtime.mach_semaphore_timedwait
#      2.06s  0.34% 97.75%      3.10s  0.51%  runtime.scanobject
#      0.37s 0.061% 97.81%      3.88s  0.64%  runtime.gcMarkDone
#      0.24s  0.04% 97.85%     20.84s  3.45%  compress/flate.(*compressor).deflate
#      0.10s 0.017% 97.87%    200.97s 33.25%  runtime.findrunnable
#      0.07s 0.012% 97.88%     12.48s  2.06%  compress/flate.(*huffmanBitWriter).writeCode
#      0.06s 0.0099% 97.89%      3.93s  0.65%  encoding/json.(*structEncoder).encode
#      0.06s 0.0099% 97.90%     32.53s  5.38%  runtime.runqgrab
#      0.05s 0.0083% 97.91%     19.23s  3.18%  compress/flate.(*huffmanBitWriter).writeTokens
#      0.05s 0.0083% 97.92%      3.10s  0.51%  encoding/json.(*mapEncoder).encode
#      0.04s 0.0066% 97.92%    132.44s 21.91%  runtime.systemstack
#      0.03s 0.005% 97.93%     20.95s  3.47%  compress/flate.(*Writer).Write

