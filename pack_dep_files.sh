# 在源代码根目录，使用git status命令获取已修改文件的列表
git status | grep modified | awk '{print $2}' > list.txt
# 在当前目录下，创建temp目录
# 将已修改文件列表逐一复制到当前目录下的temp目录
xargs -0opt ./list.txt cp --parents -t ./temp

# 将temp目录下的所有文件打包为modules.tar.gz
cd temp
tar -czf modules.tar.gz *