library(readr)
library(dplyr)

us <- read_csv("us.csv")
View(us)

o=order(us$date)

t=us[o,]
t$index=as.numeric(rownames(t))


t$cases_before=lag(t$cases) 
t$deaths_before=lag(t$deaths)

# library(data.table)
# DT <- data.table(t)
# t1=DT[ , .SD[which.min(date)], by = state]
# state_row1=t1$index
# 
# t[state_row1,"cases_before"]=0
# t[state_row1,"deaths_before"]=0

t$cases_new=t$cases-t$cases_before
t$deaths_new=t$deaths-t$deaths_before

t$cases_new[t$cases_new<0] = 0
t$deaths_new[t$deaths_new<0] = 0

us1=t[,c("date","cases","cases_new","deaths","deaths_new")]

us1$cases_new[is.na(us1$cases_new)]=0
us1$cases_new[is.na(us1$cases_new)]=0

write.csv(us1,"us_processed.csv",quote=FALSE,row.names = FALSE)



