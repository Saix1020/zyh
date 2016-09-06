#/usr/bin/perl -w

open IN, "<serverinfo.txt" or die $!;

print "{\n";
while(<IN>){

	chomp;
	my ($id, $name, $url) = split(/\s+/);
	next if !$url;
	next if $id==2;
	$url =~ /^https?:\/\/([^:]+):(\d+)(\/.*)$/;
	#print "{ \n";
	print "\t\"$name\":{\n";
	print "\t\"id\" : \"$id\",\n";
	print "\t\"name\" : \"$name\",\n";
	print "\t\"url\" : \"$url\",\n";
	print "\t\"ip\" : \"$1\",\n";
	print "\t\"port\" : \"$2\",\n";
	print "\t\"path\" : \"$3\",\n";
	print "\t\"user\" : [ \n";
	print "\t],\n";
	print "\"password\" : \"\"\n";
	print "\t},\n";


}
print "}\n";
