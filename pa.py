import re, random
import urllib.request

# head = {
#     'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
# }

# fp = open('words', 'w')

# for i in range(1, 20):
#     src = 'https://cidian.911cha.com/cixing_mingci_p{}.html'.format(i)
#     request = urllib.request.Request(url=src, headers=head)
#     page = urllib.request.urlopen(request).read().decode()
#     a = re.findall(r'<a href=".*?html" target="_blank">(.{2,4}?)</a>', page)
#     fp.write(' '.join(a))

a = list(filter(len, open('words').read().split(' ')))
print(random.sample(a, 25))