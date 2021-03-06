
#include <terrama2/core/Shared.hpp>
#include <terrama2/core/utility/Utils.hpp>
#include <terrama2/core/utility/TerraMA2Init.hpp>
#include <terrama2/core/utility/TimeUtils.hpp>
#include <terrama2/core/utility/SemanticsManager.hpp>

#include <terrama2/core/data-model/DataProvider.hpp>
#include <terrama2/core/data-model/DataSeries.hpp>
#include <terrama2/core/data-model/DataSetOccurrence.hpp>
#include <terrama2/impl/DataAccessorOccurrenceWfp.hpp>
#include <terrama2/core/data-access/OccurrenceSeries.hpp>

#include <iostream>

int main(int argc, char* argv[])
{
  terrama2::core::TerraMA2Init terramaRaii;

  {
    //DataProvider information
    terrama2::core::DataProvider* dataProvider = new terrama2::core::DataProvider();
    terrama2::core::DataProviderPtr dataProviderPtr(dataProvider);
    dataProvider->uri = "file://";
    dataProvider->uri += TERRAMA2_DATA_DIR;

    dataProvider->intent = terrama2::core::DataProviderIntent::COLLECTOR_INTENT;
    dataProvider->dataProviderType = "FILE";
    dataProvider->active = true;

    auto& semanticsManager = terrama2::core::SemanticsManager::getInstance();

    //DataSeries information
    terrama2::core::DataSeries* dataSeries = new terrama2::core::DataSeries();
    terrama2::core::DataSeriesPtr dataSeriesPtr(dataSeries);
    dataSeries->semantics = semanticsManager.getSemantics("OCCURRENCE-wfp");

    terrama2::core::DataSetOccurrence* dataSet =new terrama2::core::DataSetOccurrence();
    dataSet->active = true;
    dataSet->format.emplace("mask", "exporta_yyyyMMdd_hhmm.csv");
    dataSet->format.emplace("folder", "fire_system");
    dataSeries->datasetList.emplace_back(dataSet);

    terrama2::core::Filter filter;
    filter.discardBefore = terrama2::core::TimeUtils::stringToTimestamp("2016-05-01 08:29:00UTM+00", "%Y-%m-%d %H:%M:%S%ZP");
    filter.discardAfter = terrama2::core::TimeUtils::stringToTimestamp("2016-05-01 08:31:00UTM+00", "%Y-%m-%d %H:%M:%S%ZP");

    //accessing data
    terrama2::core::DataAccessorOccurrenceWfp accessor(dataProviderPtr, dataSeriesPtr);
    auto remover = std::make_shared<terrama2::core::FileRemover>();
    terrama2::core::OccurrenceSeriesPtr occurrenceSeries = accessor.getOccurrenceSeries(filter, remover);

    std::cout << "Last data timestamp: " << accessor.lastDateTime()->toString() << std::endl;

    assert(occurrenceSeries->occurrencesMap().size() == 1);

    std::shared_ptr<te::da::DataSet> teDataSet = (*occurrenceSeries->occurrencesMap().begin()).second.syncDataSet->dataset();

    //Print column names and types (DateTime/Double)
    int dateColumn = -1;
    int geomColumn = -1;
    std::string names, types;
    for(int i = 0; i < teDataSet->getNumProperties(); ++i)
    {
      std::string name = teDataSet->getPropertyName(i);
      names+= name + "\t";
      if(name == "data_pas")
      {
        types+= "DataTime\t";
        dateColumn = i;
      }
      else if(name == "position")
      {
        types+= "Geometry\t";
        geomColumn = i;
      }
      else
        types+= "String\t";
    }

    std::cout << names << std::endl;
    std::cout << types << std::endl;

    //Print values
    teDataSet->moveBeforeFirst();
    while(teDataSet->moveNext())
    {
      for(int i = 0; i < teDataSet->getNumProperties(); ++i)
      {

        std::cout << teDataSet->getAsString(i) << "\t";
      }
      std::cout << std::endl;
    }

    std::cout << "\nDataSet size: " << teDataSet->size() << std::endl;
  }

  

  return 0;
}
