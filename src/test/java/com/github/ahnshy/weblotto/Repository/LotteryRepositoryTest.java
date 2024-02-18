package com.github.ahnshy.weblotto.Repository;

import com.github.ahnshy.weblotto.WebLottoApplicationTests;
import com.github.ahnshy.weblotto.model.Repository.LotteryRepository;
import com.github.ahnshy.weblotto.model.entity.Lottery;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.testng.Assert;

import javax.transaction.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

public class LotteryRepositoryTest extends WebLottoApplicationTests {

    @Autowired // Dependency Injection (DI) = Singleton Pattern
    private LotteryRepository lotteryRepository;

    @Test
    public void create() {
        Lottery lottery = new Lottery(9999L, LocalDate.now(), 1,2,3,4,5,6,7, LocalDateTime.now());

        Lottery newlottery = lotteryRepository.save(lottery);

        System.out.println("newlottery : "  + newlottery);

        //lotteryRepository.delete(newlottery);
    }

    @Test
    public void read() {
        Optional<Lottery> lottery = lotteryRepository.findById(2L);

        lottery.ifPresent(findLottery-> {
            System.out.println("lottery : " + findLottery);
            System.out.println("lottery No : " + findLottery.toStringWinNo());
                });
    }

    @Test
    @Transactional
    public void update(){
        Optional<Lottery> lottery = lotteryRepository.findById(2L);
        lottery.ifPresent(findLottery-> {
            Lottery copyLottery = new Lottery(findLottery.getRound(),
                                        findLottery.getEventDate(),
                                        findLottery.getWinNo1(),
                                        findLottery.getWinNo2(),
                                        findLottery.getWinNo3(),
                                        findLottery.getWinNo4(),
                                        findLottery.getWinNo5(),
                                        findLottery.getWinNo6(),
                                        findLottery.getBonusNo(),
                                        LocalDateTime.now()
                                        );

            lotteryRepository.save(copyLottery);
        });
    }

    //@DeleteMapping("/api/Lottery")
    @Test
    @Transactional
    public void delete(){
        Optional<Lottery> lottery = lotteryRepository.findById(9999L);

        Assert.assertTrue(lottery.isPresent());

        lottery.ifPresent(findLottery-> {
            lotteryRepository.delete(findLottery);
        });

        // data delete validation test
        Optional<Lottery> deleteLottery = lotteryRepository.findById(9999L);
        if (deleteLottery.isPresent()) {
            System.out.println("There is a exist data. : " + deleteLottery.get());
        } else {
            System.out.println("There is not a exist data.");
        }

        Assert.assertFalse(deleteLottery.isPresent());
    }
}
