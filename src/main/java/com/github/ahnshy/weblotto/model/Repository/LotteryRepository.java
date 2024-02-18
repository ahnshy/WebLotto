package com.github.ahnshy.weblotto.model.Repository;

import com.github.ahnshy.weblotto.model.entity.Lottery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LotteryRepository extends JpaRepository<Lottery, Long> {

}
